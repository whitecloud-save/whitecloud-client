---
name: angular
description: Angular 框架编程助手，提供组件开发、路由、表单、HTTP、依赖注入等方面的指导和代码生成
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Grep, Glob
argument-hint: [Angular 开发任务]
---

# Angular 编程助手

本技能提供 Angular 框架开发的全面支持，包括组件、指令、服务、路由、表单、HTTP 通信等核心功能的指导和代码生成。

## 核心概念

### 组件 (Components)

组件是 Angular 应用的基本构建块，控制屏幕上的一块区域（称为视图）。

#### 创建基本组件

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: `
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  `,
  styles: [`
    h1 { color: #333; }
    p { color: #666; }
  `],
  standalone: true
})
export class MyComponent {
  title = 'Hello Angular';
  description = 'This is a simple component';
}
```

#### 组件元数据属性

- `selector`: CSS 选择器，用于在模板中标识组件（如 `'app-my-component'`）
- `template`: 内联 HTML 模板
- `templateUrl`: 外部 HTML 模板文件路径
- `styles`: 内联 CSS 样式
- `styleUrls`: 外部 CSS 样式文件路径
- `standalone`: 标记为独立组件（Angular 14+）

#### 组件生命周期钩子

```typescript
import { Component, OnInit, OnChanges, OnDestroy } from '@angular/core';

@Component({...})
export class MyComponent implements OnInit, OnChanges, OnDestroy {
  // 在输入属性初始化后调用一次
  ngOnInit(): void {
    console.log('Component initialized');
  }

  // 在输入属性变化前调用
  ngOnChanges(changes: SimpleChanges): void {
    console.log('Input changed', changes);
  }

  // 在组件销毁前调用
  ngOnDestroy(): void {
    console.log('Component destroyed');
  }
}
```

主要生命周期钩子：
- `OnInit`: 组件初始化完成后调用
- `OnChanges`: 输入属性变化时调用
- `DoCheck`: 每次变更检测时调用
- `AfterContentInit`: 内容投影完成后调用
- `AfterViewInit`: 视图初始化完成后调用
- `AfterContentChecked`: 内容检查完成后调用
- `AfterViewChecked`: 视图检查完成后调用
- `OnDestroy`: 组件销毁前调用

#### 组件交互

**输入属性 (@Input)**: 从父组件接收数据

```typescript
import { Component, Input } from '@angular/core';

@Component({...})
export class ChildComponent {
  @Input() message: string = '';
  @Input() user?: User;
}
```

**输出属性 (@Output)**: 向父组件发送事件

```typescript
import { Component, Output, EventEmitter } from '@angular/core';

@Component({...})
export class ChildComponent {
  @Output() messageChanged = new EventEmitter<string>();
  @Output() buttonClicked = new EventEmitter<void>();

  sendMessage() {
    this.messageChanged.emit('Hello from child');
  }

  handleClick() {
    this.buttonClicked.emit();
  }
}
```

**父组件使用**:

```html
<app-child 
  [message]="parentMessage"
  [user]="currentUser"
  (messageChanged)="handleMessageChange($event)"
  (buttonClicked)="handleButtonClick()">
</app-child>
```

### 独立组件 (Standalone Components)

独立组件不依赖 NgModule，更加简洁和模块化。

#### 创建独立组件

```typescript
@Component({
  selector: 'app-standalone',
  template: `
    <h1>{{ title }}</h1>
    <button (click)="increment()">Count: {{ count() }}</button>
  `,
  imports: [CommonModule, FormsModule], // 导入所需依赖
  standalone: true
})
export class StandaloneComponent {
  title = 'Standalone Component';
  count = signal(0);

  increment() {
    this.count.update(c => c + 1);
  }
}
```

#### Bootstrap 独立应用

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';

const routes: Routes = [
  { path: '', component: AppComponent },
  // 其他路由...
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
});
```

## 依赖注入 (Dependency Injection)

### 创建服务

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // 在根级别提供服务
})
export class DataService {
  private apiUrl = 'https://api.example.com';

  getData(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  constructor(private http: HttpClient) {}
}
```

### 注入服务

```typescript
import { Component, inject } from '@angular/core';
import { DataService } from './data.service';

@Component({...})
export class MyComponent {
  // 构造函数注入（传统方式）
  constructor(private dataService: DataService) {}

  // 函数注入（现代方式）
  private http = inject(HttpClient);
}
```

### Provider 类型

```typescript
// ClassProvider - 提供类实例
{ provide: DataService, useClass: DataService }

// ValueProvider - 提供静态值
{ provide: 'API_URL', useValue: 'https://api.example.com' }

// FactoryProvider - 使用工厂函数
{
  provide: 'CONFIG',
  useFactory: (dataService: DataService) => {
    return dataService.getConfig();
  },
  deps: [DataService]
}

// ExistingProvider - 别名到现有 provider
{ provide: AbstractService, useExisting: ConcreteService }
```

### InjectionToken

```typescript
import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');

// 提供值
{ provide: API_URL, useValue: 'https://api.example.com' }

// 注入值
constructor(@Inject(API_URL) private apiUrl: string) {}
```

## 路由 (Routing)

### 基本路由配置

```typescript
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'users/:id', component: UserDetailComponent },
  { path: '**', component: PageNotFoundComponent } // 通配路由
];

// NgModule 方式
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

// Standalone 方式
bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
});
```

### 路由导航

**模板导航**:

```html
<a routerLink="/about">About</a>
<a [routerLink]="['/users', userId]">User Details</a>

<router-outlet></router-outlet>
```

**编程导航**:

```typescript
import { Router, ActivatedRoute } from '@angular/router';

constructor(
  private router: Router,
  private route: ActivatedRoute
) {}

// 绝对导航
navigateToUsers() {
  this.router.navigate(['/users']);
}

// 相对导航
navigateToDetails(id: string) {
  this.router.navigate(['../', id], { relativeTo: this.route });
}

// 带查询参数
navigateWithParams() {
  this.router.navigate(['/search'], { queryParams: { q: 'angular' } });
}
```

### 路由参数

```typescript
import { ActivatedRoute } from '@angular/router';

constructor(private route: ActivatedRoute) {}

ngOnInit() {
  // 获取快照参数
  const id = this.route.snapshot.paramMap.get('id');

  // 订阅参数变化
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
  });

  // 获取查询参数
  this.route.queryParamMap.subscribe(params => {
    const page = params.get('page');
  });
}
```

### 路由守卫 (Route Guards)

```typescript
// CanActivate - 激活守卫
export const canActivateGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

// 使用守卫
const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [canActivateGuard]
  }
];
```

## 表单 (Forms)

Angular 支持两种表单方式：响应式表单和模板驱动表单。

### 响应式表单 (Reactive Forms)

更适合复杂场景，提供更好的可测试性和可扩展性。

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({...})
export class ReactiveFormComponent {
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      age: [null, [Validators.min(18), Validators.max(120)]],
      address: this.fb.group({
        street: [''],
        city: [''],
        zip: ['']
      }),
      hobbies: this.fb.array([])
    });
  }

  // 添加爱好
  addHobby() {
    const hobbies = this.userForm.get('hobbies') as FormArray;
    hobbies.push(this.fb.control(''));
  }

  // 提交表单
  onSubmit() {
    if (this.userForm.valid) {
      console.log(this.userForm.value);
    }
  }
}
```

**模板**:

```html
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <input formControlName="name" placeholder="Name">
  <div *ngIf="userForm.get('name')?.errors?.['required']">Name is required</div>
  <div *ngIf="userForm.get('name')?.errors?.['minlength']">Name must be at least 3 characters</div>

  <input formControlName="email" placeholder="Email">
  <div *ngIf="userForm.get('email')?.errors?.['email']">Invalid email format</div>

  <div formGroupName="address">
    <input formControlName="street" placeholder="Street">
    <input formControlName="city" placeholder="City">
    <input formControlName="zip" placeholder="Zip">
  </div>

  <div formArrayName="hobbies">
    <div *ngFor="let hobby of userForm.get('hobbies')?.controls; let i = index">
      <input [formControlName]="i" placeholder="Hobby">
    </div>
  </div>

  <button type="submit" [disabled]="userForm.invalid">Submit</button>
</form>
```

### 模板驱动表单 (Template-Driven Forms)

更简单，适合小型表单。

```typescript
import { Component } from '@angular/core';

@Component({...})
export class TemplateFormComponent {
  user = {
    name: '',
    email: ''
  };

  onSubmit() {
    console.log(this.user);
  }
}
```

**模板**:

```html
<form #userForm="ngForm" (ngSubmit)="onSubmit()">
  <input [(ngModel)]="user.name" name="name" required minlength="3" #name="ngModel">
  <div *ngIf="name.invalid && name.touched">
    <div *ngIf="name.errors?.['required']">Name is required</div>
    <div *ngIf="name.errors?.['minlength']">Name must be at least 3 characters</div>
  </div>

  <input [(ngModel)]="user.email" name="email" required email #email="ngModel">
  <div *ngIf="email.invalid && email.touched">
    <div *ngIf="email.errors?.['required']">Email is required</div>
    <div *ngIf="email.errors?.['email']">Invalid email format</div>
  </div>

  <button type="submit" [disabled]="userForm.invalid">Submit</button>
</form>
```

## HTTP 通信

### HttpClient 基本使用

```typescript
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({...})
export class ApiService {
  private apiUrl = 'https://api.example.com';

  constructor(private http: HttpClient) {}

  // GET 请求
  getData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/data`);
  }

  // GET 请求带参数
  getDataById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/data/${id}`);
  }

  // POST 请求
  createData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/data`, data);
  }

  // PUT 请求
  updateData(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/data/${id}`, data);
  }

  // DELETE 请求
  deleteData(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/data/${id}`);
  }

  // GET 请求带查询参数
  searchData(params: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/data`, { params });
  }
}
```

### 使用 RxJS 操作符

```typescript
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, retry } from 'rxjs/operators';

getData(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/data`).pipe(
    retry(3), // 重试 3 次
    map(data => data.map(item => ({ ...item, formatted: true }))), // 转换数据
    tap(data => console.log('Data loaded:', data)), // 副作用
    catchError(error => {
      console.error('Error occurred:', error);
      return throwError(() => error); // 或返回默认值: of([])
    })
  );
}
```

### HTTP 拦截器

```typescript
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 添加认证头
    const token = localStorage.getItem('authToken');
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

    return next.handle(authReq);
  }
}

// 配置拦截器
{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
```

## 指令 (Directives)

### 属性指令

```typescript
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  @Input('appHighlight') highlightColor = 'yellow';

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(null);
  }

  private highlight(color: string | null) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
```

**使用**:

```html
<p appHighlight>Hover over me!</p>
<p [appHighlight]="'red'">Custom color!</p>
```

### 结构指令

```typescript
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appUnless]'
})
export class UnlessDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
```

**使用**:

```html
<div *appUnless="condition">Show unless condition is true</div>
```

## 内置指令

### 条件渲染 (@if)

```html
@if (isLoggedIn) {
  <p>Welcome back!</p>
} @else if (isGuest) {
  <p>Welcome guest!</p>
} @else {
  <p>Please login</p>
}
```

### 循环 (@for)

```html
@for (item of items; track item.id; let i = $index) {
  <div>{{ i + 1 }}. {{ item.name }}</div>
} @empty {
  <div>No items found</div>
}
```

### 条件切换 (@switch)

```html
@switch (status) {
  @case ('success') {
    <p>Success!</p>
  }
  @case ('error') {
    <p>Error!</p>
  }
  @default {
    <p>Unknown status</p>
  }
}
```

## 管道 (Pipes)

### AsyncPipe

自动订阅 observable 或 promise。

```typescript
@Component({
  template: `
    @if (data$ | async; as data) {
      <p>{{ data.name }}</p>
    }
  `
})
export class MyComponent {
  data$: Observable<Data>;

  constructor(private service: DataService) {
    this.data$ = service.getData();
  }
}
```

### 自定义管道

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 20): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + '...' : value;
  }
}
```

**使用**:

```html
<p>{{ longText | truncate:50 }}</p>
```

## Signals (Angular 16+)

Signals 提供了新的响应式方式来管理状态。

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({...})
export class SignalComponent {
  // 信号
  count = signal(0);
  name = signal('Angular');

  // 计算信号
  doubleCount = computed(() => this.count() * 2);
  greeting = computed(() => `Hello, ${this.name()}!`);

  constructor() {
    // 副作用
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }

  increment() {
    this.count.update(c => c + 1);
  }

  setName(newName: string) {
    this.name.set(newName);
  }
}
```

## 测试

### 组件测试

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello Angular');
  });
});
```

### HTTP 测试

```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch data', () => {
    const mockData = [{ id: 1, name: 'Test' }];

    service.getData().subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('https://api.example.com/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

## 最佳实践

1. **使用独立组件**: 优先使用 standalone 组件，减少 NgModules 的复杂性
2. **类型安全**: 充分利用 TypeScript 的类型系统
3. **变更检测策略**: 对于不需要频繁变更检测的组件，使用 `OnPush` 策略
4. **使用 Signals**: 优先使用 Signals 管理状态，而不是传统的可观察对象
5. **模块化服务**: 将服务按功能域分组，使用 providedIn 限制作用域
6. **异步处理**: 始终正确处理 Observables 和 Promises 的取消订阅
7. **响应式表单**: 对于复杂表单，使用响应式表单而不是模板驱动表单
8. **单元测试**: 为组件、服务和管道编写单元测试
9. **性能优化**: 使用 trackBy 优化 *ngFor，避免不必要的 DOM 操作
10. **错误处理**: 在 HTTP 请求和异步操作中添加适当的错误处理

## 常见问题

### 如何处理异步数据

使用 AsyncPipe 或在组件中订阅：

```typescript
// 推荐：使用 AsyncPipe
data$ = this.http.get('/api/data');

// 或：手动订阅（记得取消订阅）
private destroy$ = new Subject<void>();

ngOnInit() {
  this.http.get('/api/data')
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      this.data = data;
    });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 如何优化性能

1. 使用 `ChangeDetectionStrategy.OnPush`
2. 使用 trackBy 优化列表渲染
3. 使用 OnPush + Signals
4. 避免在模板中使用复杂表达式
5. 使用虚拟滚动处理大型列表

### 如何调试 Angular 应用

1. 使用 Angular DevTools 浏览器扩展
2. 在组件中添加 console.log
3. 使用 Angular 的内置调试工具
4. 查看 Chrome DevTools 的 Performance 面板

## 常用模块和包

```typescript
// 核心
import { Component, Directive, Pipe, Injectable, NgModule } from '@angular/core';

// 常用指令
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// HTTP
import { HttpClientModule } from '@angular/common/http';

// 路由
import { RouterModule, Routes } from '@angular/router';

// 动画
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// RxJS
import { Observable, of, Subject } from 'rxjs';
import { map, filter, switchMap, tap, catchError, retry } from 'rxjs/operators';
```

## 参考资源

- Angular 官方文档: https://angular.dev
- Angular CLI: `ng help`
- RxJS 文档: https://rxjs.dev
- TypeScript 文档: https://www.typescriptlang.org
