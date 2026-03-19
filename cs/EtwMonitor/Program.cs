using System;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Session;

// 1. 解析命令行参数
if (args.Length < 3)
{
  Console.WriteLine("用法: <ParentPID> <PipeName> <TargetPID1,TargetPID2...>");
  return;
}

if (!int.TryParse(args[0], out int parentPid))
{
  Console.WriteLine("ParentPID 必须是整数");
  return;
}

string pipeName = args[1];
// 自动剥离 Node.js 习惯带入的绝对路径前缀
if (pipeName.StartsWith(@"\\.\pipe\"))
{
  pipeName = pipeName.Substring(@"\\.\pipe\".Length);
}
var targetPids = args[2].Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(int.Parse)
                        .ToHashSet();

// 使用全局 CancellationTokenSource 控制整个应用的生命周期
using var cts = new CancellationTokenSource();

Console.WriteLine($"[INFO] 初始化... 父进程 PID: {parentPid}, 管道: {pipeName}, 监听目标数: {targetPids.Count}");

// =========================================================================
// 创建高性能队列，用于缓冲 ETW 抓取到的高频文件路径
// =========================================================================
var fileChannel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
{
  SingleReader = true, // 只有一个 Task 负责写管道
  SingleWriter = false // ETW 可能有多个线程触发写入
});

// =========================================================================
// 建立与父进程的命名管道连接 (全双工 InOut)
// =========================================================================
// 这里假设父进程是服务端 (NamedPipeServerStream)，本程序作为客户端去连接
using var pipeClient = new NamedPipeClientStream(".", pipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
try
{
  Console.WriteLine($"[INFO] 正在连接父进程管道 {pipeName}...");
  await pipeClient.ConnectAsync(5000, cts.Token); // 5秒超时
  Console.WriteLine("[INFO] 管道连接成功。");
}
catch (Exception ex)
{
  Console.WriteLine($"[ERROR] 连接管道失败: {ex.Message}");
  return;
}

using var pipeReader = new StreamReader(pipeClient);
using var pipeWriter = new StreamWriter(pipeClient) { AutoFlush = true };

async Task SendErrorAsync(string message)
{
  try
  {
    await pipeWriter.WriteLineAsync($"Error: {message}");
  }
  catch { }
}

// =========================================================================
// 功能 2: 守护进程 - 监听 ParentPID 存活状况
// =========================================================================
_ = Task.Run(async () =>
{
  try
  {
    var parentProcess = Process.GetProcessById(parentPid);
    parentProcess.EnableRaisingEvents = true;

    // .NET 现代写法，异步等待进程退出
    await parentProcess.WaitForExitAsync(cts.Token);
    Console.WriteLine("\n[WARN] 检测到父进程已退出，子进程准备自毁...");
    cts.Cancel();
  }
  catch (ArgumentException)
  {
    Console.WriteLine("\n[WARN] 启动时未找到指定的父进程，立刻退出...");
    await SendErrorAsync("启动时未找到指定的父进程");
    cts.Cancel();
  }
  catch (OperationCanceledException) { /* 忽略取消异常 */ }
});

// =========================================================================
// 功能 3: 监听 Pipe 管道的关闭指令
// =========================================================================
_ = Task.Run(async () =>
{
  try
  {
    while (!cts.IsCancellationRequested)
    {
      var command = await pipeReader.ReadLineAsync(cts.Token);
      if (command == null)
      {
        Console.WriteLine("\n[INFO] 管道已断开，正在退出...");
        cts.Cancel();
        break;
      }
      if (string.Equals(command.Trim(), "close", StringComparison.OrdinalIgnoreCase))
      {
        Console.WriteLine("\n[INFO] 收到来自管道的 close 指令，正在退出...");
        cts.Cancel();
        break;
      }
    }
  }
  catch (OperationCanceledException) { /* 忽略 */ }
  catch (Exception ex)
  {
    Console.WriteLine($"[ERROR] 管道读取异常: {ex.Message}");
    await SendErrorAsync($"管道读取异常: {ex.Message}");
    cts.Cancel();
  }
});

// =========================================================================
// 独立消费任务：从 Channel 拿取文件名，写入 Pipe，发送给父进程
// =========================================================================
_ = Task.Run(async () =>
{
  try
  {
    await foreach (var fileName in fileChannel.Reader.ReadAllAsync(cts.Token))
    {
      await pipeWriter.WriteLineAsync(fileName);
    }
  }
  catch (OperationCanceledException) { /* 忽略 */ }
  catch (Exception ex)
  {
    Console.WriteLine($"[ERROR] 管道写入异常: {ex.Message}");
    await SendErrorAsync($"管道写入异常: {ex.Message}");
  }
});

// =========================================================================
// 功能 1: 启动 ETW 监听目标进程的文件写入操作
// =========================================================================
if (!(TraceEventSession.IsElevated() ?? false))
{
  Console.WriteLine("[ERROR] ETW (Event Tracing for Windows) 需要管理员权限！请以管理员身份运行此程序。");
  await SendErrorAsync("ETW 需要管理员权限");
  return;
}

// ETW 是阻塞型 API，需要放入独立线程
_ = Task.Run(async () =>
{
  try
  {
    // 创建 Kernel 级别的 Trace Session
    using var session = new TraceEventSession(KernelTraceEventParser.KernelSessionName);

    // 当收到退出信号时，关闭 session，从而结束下面的阻塞方法 session.Source.Process()
    using var ctr = cts.Token.Register(() => session.Dispose());

    // 启用内核提供程序中的磁盘IO和文件IO初始化标志
    session.EnableKernelProvider(KernelTraceEventParser.Keywords.DiskFileIO | KernelTraceEventParser.Keywords.FileIOInit);

    // 订阅 FileIOWrite 事件
    session.Source.Kernel.FileIOWrite += data =>
    {
      // 判断是否是我们需要监控的目标进程，且文件名不为空
      if (targetPids.Contains(data.ProcessID) && !string.IsNullOrWhiteSpace(data.FileName))
      {
        // 将文件名扔进 Channel (非阻塞极速操作)
        fileChannel.Writer.TryWrite(data.FileName);
      }
    };

    Console.WriteLine("[INFO] ETW 监听已启动...");
    // 开始处理事件（此方法会阻塞当前线程，直到 session.Dispose() 被调用）
    session.Source.Process();
  }
  catch (Exception ex)
  {
    if (!cts.IsCancellationRequested)
    {
      Console.WriteLine($"[ERROR] ETW 发生致命错误: {ex.Message}");
      await SendErrorAsync($"ETW 发生致命错误: {ex.Message}");
      cts.Cancel();
    }
  }
});

// =========================================================================
// 挂起主线程，直到触发 Cancellation (父进程退出 / 收到 close 指令)
// =========================================================================
try
{
  await Task.Delay(Timeout.Infinite, cts.Token);
}
catch (TaskCanceledException)
{
  Console.WriteLine("[INFO] 程序安全退出。");
}
