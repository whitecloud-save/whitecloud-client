using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

namespace ElectronUpdater
{
  class Program
  {
    static void Main(string[] args)
    {
      // 参数验证
      if (args.Length < 4) return;

      try
      {
        // 1. 解析参数
        string pidStr = args[0];
        string targetAsar = args[1];
        string sourceAsar = args[2];
        string restartExe = args[3];

        // 2. 等待主进程完全释放文件 (PID 监控)
        try
        {
          int pid = int.Parse(pidStr);
          Process parentProcess = Process.GetProcessById(pid);
          // 最多等待 15 秒，期间不断检测
          for (int i = 0; i < 30; i++)
          {
            if (parentProcess.HasExited) break;
            Thread.Sleep(500);
          }
        }
        catch
        {
          // 如果 PID 已经找不到了，说明主程序已退出，直接跳过
        }

        // 3. 执行文件替换逻辑 (重试机制)
        bool success = false;
        for (int i = 0; i < 10; i++)
        {
          try
          {
            // 如果目标文件存在，先删除
            if (File.Exists(targetAsar))
            {
              File.Delete(targetAsar);
            }
            // 移动新文件到目标位置
            File.Move(sourceAsar, targetAsar);
            success = true;
            break;
          }
          catch
          {
            // 文件可能仍被锁定（如渲染进程未退干净），等待后重试
            Thread.Sleep(1000);
          }
        }

        // 4. 重启应用
        if (success && File.Exists(restartExe))
        {
          Process.Start(restartExe);
        }
      }
      catch (Exception ex)
      {
        // 发生意外错误时，记录在本地，方便你调试
        File.WriteAllText("update_crash.log", ex.ToString());
      }
    }
  }
}
