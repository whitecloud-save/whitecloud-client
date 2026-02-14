---
name: ng-zorro
description: NG-ZORRO (Ant Design) Angular UI 组件库开发助手，提供超过 70 个企业级 UI 组件的使用指导和代码生成
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Grep, Glob
argument-hint: [NG-ZORRO 组件开发任务]
---

# NG-ZORRO (Ant Design) 编程助手

NG-ZORRO 是一个基于 Ant Design 的企业级 Angular UI 组件库，提供超过 70 个高质量组件，支持 TypeScript，提供强大的自定义能力。

## 安装和配置

### 安装 NG-ZORRO

```bash
# 安装 NG-ZORRO
ng add ng-zorro-antd
```

### 导入模块

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
// 导入其他需要的模块...

@NgModule({
  imports: [
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    // ...
  ]
})
export class AppModule {}
```

### Standalone 组件使用

```typescript
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  standalone: true,
  imports: [NzButtonModule, NzInputModule],
  template: `<button nz-button nzType="primary">Click Me</button>`
})
export class MyComponent {}
```

## 通用组件

### 按钮 (Button)

```typescript
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  imports: [NzButtonModule],
  template: `
    <!-- 基本按钮类型 -->
    <button nz-button nzType="primary">Primary Button</button>
    <button nz-button nzType="default">Default Button</button>
    <button nz-button nzType="dashed">Dashed Button</button>
    <button nz-button nzType="text">Text Button</button>
    <a nz-button nzType="link">Link Button</a>

    <!-- 加载状态 -->
    <button nz-button nzType="primary" [nzLoading]="isLoading">Loading</button>

    <!-- 按钮尺寸 -->
    <button nz-button nzType="primary" nzSize="large">Large</button>
    <button nz-button nzType="primary" nzSize="default">Default</button>
    <button nz-button nzType="primary" nzSize="small">Small</button>

    <!-- 危险和禁用状态 -->
    <button nz-button nzDanger>Delete</button>
    <button nz-button [disabled]="true">Disabled</button>

    <!-- 块级按钮和形状 -->
    <button nz-button nzBlock>Block Button</button>
    <button nz-button nzShape="circle">Icon</button>
    <button nz-button nzShape="round">Round</button>

    <!-- Ghost 按钮（透明背景） -->
    <button nz-button nzGhost>Ghost Button</button>
  `
})
export class ButtonDemoComponent {
  isLoading = false;
}
```

**主要属性**:
- `nzType`: 按钮类型 (`'primary' | 'default' | 'dashed' | 'text' | 'link'`)
- `nzSize`: 尺寸 (`'large' | 'default' | 'small'`)
- `nzShape`: 形状 (`'default' | 'circle' | 'round'`)
- `nzLoading`: 加载状态
- `nzDanger`: 危险状态
- `nzBlock`: 块级按钮
- `nzGhost`: Ghost 按钮

### 图标 (Icon)

```typescript
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  imports: [NzIconModule],
  template: `
    <nz-icon nzType="search"></nz-icon>
    <nz-icon nzType="user" nzTheme="fill"></nz-icon>
    <nz-icon nzType="setting" [nzSpin]="true"></nz-icon>
  `
})
export class IconDemoComponent {}
```

## 表单组件

### 输入框 (Input)

```typescript
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  imports: [NzInputModule],
  template: `
    <!-- 基本输入框 -->
    <input nz-input placeholder="Basic input" />

    <!-- 尺寸 -->
    <input nz-input nzSize="large" placeholder="Large input" />
    <input nz-input nzSize="small" placeholder="Small input" />

    <!-- 变体 -->
    <input nz-input nzVariant="outlined" placeholder="Outlined" />
    <input nz-input nzVariant="filled" placeholder="Filled" />
    <input nz-input nzVariant="borderless" placeholder="Borderless" />

    <!-- 前缀和后缀 -->
    <input nz-input [nzPrefix]="prefixTemplate" />
    <ng-template #prefixTemplate><nz-icon nzType="user"></nz-icon></ng-template>

    <input nz-input [nzSuffix]="suffixTemplate" />
    <ng-template #suffixTemplate><nz-icon nzType="search"></nz-icon></ng-template>

    <!-- 文本域 -->
    <textarea nz-input [nzAutosize]="{ minRows: 2, maxRows: 6 }"></textarea>

    <!-- 状态 -->
    <input nz-input nzStatus="error" />
    <input nz-input nzStatus="warning" />
  `
})
export class InputDemoComponent {}
```

**主要属性**:
- `nzSize`: 尺寸 (`'large' | 'default' | 'small'`)
- `nzVariant`: 变体 (`'outlined' | 'filled' | 'borderless' | 'underlined'`)
- `nzStatus`: 状态 (`'error' | 'warning'`)
- `nzAutosize`: 自动调整高度（文本域）
- `nzPrefix`: 前缀模板
- `nzSuffix`: 后缀模板

### 选择框 (Select)

```typescript
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  imports: [NzSelectModule],
  template: `
    <!-- 基本选择 -->
    <nz-select nzPlaceHolder="Select a value">
      <nz-option nzValue="1" nzLabel="Option 1"></nz-option>
      <nz-option nzValue="2" nzLabel="Option 2"></nz-option>
    </nz-select>

    <!-- 禁用选项 -->
    <nz-select>
      <nz-option nzValue="1" nzLabel="Option 1" nzDisabled></nz-option>
      <nz-option nzValue="2" nzLabel="Option 2"></nz-option>
    </nz-select>

    <!-- 多选 -->
    <nz-select nzMode="multiple">
      <nz-option nzValue="1" nzLabel="Option 1"></nz-option>
      <nz-option nzValue="2" nzLabel="Option 2"></nz-option>
    </nz-select>

    <!-- 标签多选 -->
    <nz-select nzMode="tags">
      <nz-option nzValue="1" nzLabel="Option 1"></nz-option>
    </nz-select>

    <!-- 使用 nzOptions -->
    <nz-select [nzOptions]="options"></nz-select>
  `
})
export class SelectDemoComponent {
  options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' }
  ];
}
```

**主要属性**:
- `nzMode`: 模式 (`'default' | 'multiple' | 'tags'`)
- `nzOptions`: 选项数组
- `nzLoading`: 加载状态
- `nzDisabled`: 禁用状态
- `nzShowSearch`: 显示搜索框
- `nzServerSearch`: 服务器端搜索

### 单选框 (Radio)

```typescript
import { NzRadioModule } from 'ng-zorro-antd/radio';

@Component({
  imports: [NzRadioModule],
  template: `
    <!-- 单选框组 -->
    <nz-radio-group [(ngModel)]="radioValue">
      <label nz-radio nzValue="A">A</label>
      <label nz-radio nzValue="B">B</label>
      <label nz-radio nzValue="C">C</label>
    </nz-radio-group>

    <!-- 单选按钮组 -->
    <nz-radio-group [(ngModel)]="radioValue">
      <label nz-radio-button nzValue="A">A</label>
      <label nz-radio-button nzValue="B">B</label>
      <label nz-radio-button nzValue="C">C</label>
    </nz-radio-group>

    <!-- 禁用状态 -->
    <label nz-radio nzDisabled>Disabled</label>
  `
})
export class RadioDemoComponent {
  radioValue = 'A';
}
```

### 复选框 (Checkbox)

```typescript
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

@Component({
  imports: [NzCheckboxModule],
  template: `
    <!-- 单个复选框 -->
    <label nz-checkbox [(ngModel)]="checked">Checkbox</label>

    <!-- 复选框组 -->
    <nz-checkbox-group [(ngModel)]="checkedValues">
      <label nz-checkbox nzValue="Apple">Apple</label>
      <label nz-checkbox nzValue="Orange">Orange</label>
      <label nz-checkbox nzValue="Banana">Banana</label>
    </nz-checkbox-group>

    <!-- 使用 nzOptions -->
    <nz-checkbox-group [nzOptions]="options"></nz-checkbox-group>

    <!-- 半选状态 -->
    <label nz-checkbox [nzIndeterminate]="indeterminate">Indeterminate</label>
  `
})
export class CheckboxDemoComponent {
  checked = true;
  checkedValues = ['Apple'];
  indeterminate = true;

  options = [
    { label: 'Apple', value: 'Apple' },
    { label: 'Orange', value: 'Orange' },
    { label: 'Banana', value: 'Banana' }
  ];
}
```

### 开关 (Switch)

```typescript
import { NzSwitchModule } from 'ng-zorro-antd/switch';

@Component({
  imports: [NzSwitchModule],
  template: `
    <nz-switch [(ngModel)]="switchValue"></nz-switch>
    <nz-switch [(ngModel)]="switchValue" nzCheckedChildren="开" nzUnCheckedChildren="关"></nz-switch>
    <nz-switch [(ngModel)]="switchValue" nzLoading></nz-switch>
    <nz-switch [(ngModel)]="switchValue" nzDisabled></nz-switch>
  `
})
export class SwitchDemoComponent {
  switchValue = true;
}
```

### 滑动输入条 (Slider)

```typescript
import { NzSliderModule } from 'ng-zorro-antd/slider';

@Component({
  imports: [NzSliderModule],
  template: `
    <nz-slider [(ngModel)]="value"></nz-slider>
    <nz-slider [(ngModel)]="rangeValue" nzRange></nz-slider>
    <nz-slider [(ngModel)]="value" [nzMarks]="marks"></nz-slider>
  `
})
export class SliderDemoComponent {
  value = 30;
  rangeValue = [20, 50];
  marks = {
    0: '0°C',
    26: '26°C',
    37: '37°C',
    100: {
      style: { color: '#f50' },
      label: '100°C'
    }
  };
}
```

### 表单 (Form)

```typescript
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  imports: [NzFormModule, NzInputModule, NzButtonModule, NzSelectModule],
  template: `
    <form nz-form [formGroup]="validateForm" (ngSubmit)="submitForm()">
      <!-- 表单项 -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="email">
          E-mail
        </nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="Please input your email!">
          <input nz-input formControlName="email" id="email" />
        </nz-form-control>
      </nz-form-item>

      <!-- 自定义错误提示 -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="password">
          Password
        </nz-form-label>
        <nz-form-control [nzSpan]="14" [nzErrorTip]="errorTpl">
          <input nz-input type="password" formControlName="password" id="password" />
          <ng-template #errorTpl let-control>
            @if (control.hasError('required')) {
              <span>Please input your password!</span>
            }
            @if (control.hasError('minlength')) {
              <span>Password must be at least 6 characters</span>
            }
          </ng-template>
        </nz-form-control>
      </nz-form-item>

      <!-- 提交按钮 -->
      <nz-form-item>
        <nz-form-control [nzSpan]="14" [nzOffset]="6">
          <button nz-button nzType="primary" [disabled]="!validateForm.valid">Submit</button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class FormDemoComponent {
  validateForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.validateForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      console.log(this.validateForm.value);
    }
  }
}
```

**主要属性**:
- `nzLayout`: 表单布局 (`'horizontal' | 'vertical' | 'inline'`)
- `nzLabelAlign`: 标签对齐 (`'left' | 'right'`)
- `nzNoColon`: 隐藏冒号
- `nzLabelWrap`: 标签换行

### 日期选择器 (DatePicker)

```typescript
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  imports: [NzDatePickerModule],
  template: `
    <!-- 基本日期选择 -->
    <nz-date-picker [(ngModel)]="date"></nz-date-picker>

    <!-- 带时间的日期选择 -->
    <nz-date-picker [(ngModel)]="date" [nzShowTime]="true"></nz-date-picker>

    <!-- 范围选择 -->
    <nz-range-picker [(ngModel)]="range"></nz-range-picker>

    <!-- 周选择器 -->
    <nz-week-picker [(ngModel)]="date"></nz-week-picker>

    <!-- 月选择器 -->
    <nz-month-picker [(ngModel)]="date"></nz-month-picker>

    <!-- 年选择器 -->
    <nz-year-picker [(ngModel)]="date"></nz-year-picker>

    <!-- 禁用日期 -->
    <nz-date-picker [nzDisabledDate]="disabledDate"></nz-date-picker>
  `
})
export class DatePickerDemoComponent {
  date: Date | null = null;
  range: Date[] | null = null;

  disabledDate = (current: Date): boolean => {
    return !current || current.getTime() < Date.now();
  };
}
```

**主要属性**:
- `nzShowTime`: 显示时间
- `nzFormat`: 日期格式
- `nzDisabledDate`: 禁用日期函数
- `nzShowToday`: 显示"今天"按钮
- `nzShowWeekNumber`: 显示周数

### 时间选择器 (TimePicker)

```typescript
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';

@Component({
  imports: [NzTimePickerModule],
  template: `
    <nz-time-picker [(ngModel)]="time"></nz-time-picker>
    <nz-time-picker [(ngModel)]="time" nzFormat="HH:mm"></nz-time-picker>
    <nz-time-picker [(ngModel)]="time" [nzDisabledHours]="disabledHours"></nz-time-picker>
  `
})
export class TimePickerDemoComponent {
  time: Date | null = null;

  disabledHours(): number[] {
    return [1, 2, 3];
  }
}
```

## 数据展示组件

### 表格 (Table)

```typescript
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  imports: [NzTableModule],
  template: `
    <!-- 基本表格 -->
    <nz-table #basicTable [nzData]="listOfData">
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
          <th>Address</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of basicTable.data">
          <td>{{ data.name }}</td>
          <td>{{ data.age }}</td>
          <td>{{ data.address }}</td>
          <td>
            <a>Action</a>
          </td>
        </tr>
      </tbody>
    </nz-table>

    <!-- 可选表格 -->
    <nz-table [nzData]="listOfData" [(nzPageIndex)]="pageIndex" [(nzPageSize)]="pageSize">
      <thead>
        <tr>
          <th [(nzColumnKey)]="'name'" [nzShowSort]="true" [nzSortFn]="true">Name</th>
          <th [(nzColumnKey)]="'age'" [nzShowSort]="true" [nzSortFn]="true">Age</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of table.data">
          <td>{{ data.name }}</td>
          <td>{{ data.age }}</td>
          <td>{{ data.address }}</td>
        </tr>
      </tbody>
    </nz-table>

    <!-- 带分页的表格 -->
    <nz-table
      [nzData]="listOfData"
      [nzFrontPagination]="false"
      [nzTotal]="total"
      [nzPageIndex]="pageIndex"
      [nzPageSize]="pageSize"
      [nzLoading]="loading"
      (nzQueryParams)="onQueryParamsChange($event)">
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of table.data">
          <td>{{ data.name }}</td>
          <td>{{ data.age }}</td>
        </tr>
      </tbody>
    </nz-table>
  `
})
export class TableDemoComponent {
  listOfData = [
    { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
    { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
    { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' }
  ];

  pageIndex = 1;
  pageSize = 10;
  total = 0;
  loading = false;

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort, filter } = params;
    this.loadDataFromServer(pageIndex, pageSize, sort, filter);
  }
}
```

**主要属性**:
- `nzData`: 数据数组
- `nzFrontPagination`: 前端分页
- `nzTotal`: 总数据量
- `nzPageIndex`: 当前页
- `nzPageSize`: 每页条数
- `nzBordered`: 边框
- `nzSize`: 尺寸 (`'middle' | 'small' | 'default'`)

### 标签 (Tag)

```typescript
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  imports: [NzTagModule],
  template: `
    <nz-tag>Tag 1</nz-tag>
    <nz-tag nzColor="magenta">magenta</nz-tag>
    <nz-tag nzColor="red">red</nz-tag>
    <nz-tag nzColor="volcano">volcano</nz-tag>
    <nz-tag nzColor="orange">orange</nz-tag>
    <nz-tag nzColor="gold">gold</nz-tag>
    <nz-tag nzColor="lime">lime</nz-tag>
    <nz-tag nzColor="green">green</nz-tag>
    <nz-tag nzColor="cyan">cyan</nz-tag>
    <nz-tag nzColor="blue">blue</nz-tag>
    <nz-tag nzColor="geekblue">geekblue</nz-tag>
    <nz-tag nzColor="purple">purple</nz-tag>

    <!-- 可关闭标签 -->
    <nz-tag (nzAfterClose)="afterClose()">Tag Closable</nz-tag>
    <nz-tag [nzCloseIcon]="closeTemplate">Tag Custom Close</nz-tag>
    <ng-template #closeTemplate>×</ng-template>
  `
})
export class TagDemoComponent {
  afterClose(): void {
    console.log('Tag closed');
  }
}
```

### 进度条 (Progress)

```typescript
import { NzProgressModule } from 'ng-zorro-antd/progress';

@Component({
  imports: [NzProgressModule],
  template: `
    <nz-progress [nzPercent]="30"></nz-progress>
    <nz-progress [nzPercent]="50" nzStatus="active"></nz-progress>
    <nz-progress [nzPercent]="70" [nzStatus]="'exception'"></nz-progress>
    <nz-progress [nzPercent]="100" [nzSuccessPercent]="100"></nz-progress>

    <!-- 环形进度条 -->
    <nz-progress type="circle" [nzPercent]="75"></nz-progress>

    <!-- 仪表盘 -->
    <nz-progress type="dashboard" [nzPercent]="75"></nz-progress>
  `
})
export class ProgressDemoComponent {}
```

### 树形控件 (Tree)

```typescript
import { NzTreeModule } from 'ng-zorro-antd/tree';

@Component({
  imports: [NzTreeModule],
  template: `
    <nz-tree
      [nzData]="nodes"
      (nzClick)="activeNode($event)"
      (nzCheckBoxChange)="checkNode($event)">
    </nz-tree>
  `
})
export class TreeDemoComponent {
  nodes = [
    {
      title: 'Parent 1',
      key: '100',
      children: [
        { title: 'Child 1', key: '1001' },
        { title: 'Child 2', key: '1002' }
      ]
    }
  ];

  activeNode(data: NzTreeNode): void {
    console.log(data);
  }

  checkNode(data: NzFormatEmitEvent): void {
    console.log(data);
  }
}
```

### 时间轴 (Timeline)

```typescript
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  imports: [NzTimelineModule],
  template: `
    <nz-timeline>
      <nz-timeline-item>Create a services site 2015-09-01</nz-timeline-item>
      <nz-timeline-item>Solve initial network problems 2015-09-01</nz-timeline-item>
      <nz-timeline-item color="green">Technical testing 2015-09-01</nz-timeline-item>
      <nz-timeline-item color="red">Network problems being solved 2015-09-01</nz-timeline-item>
    </nz-timeline>
  `
})
export class TimelineDemoComponent {}
```

## 导航组件

### 面包屑 (Breadcrumb)

```typescript
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

@Component({
  imports: [NzBreadCrumbModule],
  template: `
    <!-- 手动创建 -->
    <nz-breadcrumb>
      <nz-breadcrumb-item>Home</nz-breadcrumb-item>
      <nz-breadcrumb-item><a>Application Center</a></nz-breadcrumb-item>
      <nz-breadcrumb-item>Application List</nz-breadcrumb-item>
    </nz-breadcrumb>

    <!-- 自动生成 -->
    <nz-breadcrumb [nzAutoGenerate]="true"></nz-breadcrumb>
  `
})
export class BreadcrumbDemoComponent {}
```

**主要属性**:
- `nzAutoGenerate`: 自动生成
- `nzRouteLabel`: 路由标签属性名
- `nzSeparator`: 自定义分隔符

### 下拉菜单 (Dropdown)

```typescript
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
  imports: [NzDropDownModule],
  template: `
    <a nz-dropdown [nzDropdownMenu]="menu">Hover me</a>
    <nz-dropdown-menu #menu="nzDropdownMenu">
      <ul nz-menu>
        <li nz-menu-item>1st menu item</li>
        <li nz-menu-item>2nd menu item</li>
        <li nz-submenu nzTitle="sub menu">
          <ul>
            <li nz-menu-item>3rd menu item</li>
            <li nz-menu-item>4th menu item</li>
          </ul>
        </li>
        <li nz-menu-item nzDisabled>disabled menu item</li>
      </ul>
    </nz-dropdown-menu>

    <!-- 点击触发 -->
    <a nz-dropdown [nzDropdownMenu]="menu" [nzTrigger]="'click'">Click me</a>
  `
})
export class DropdownDemoComponent {}
```

### 菜单 (Menu)

```typescript
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  imports: [NzMenuModule],
  template: `
    <ul nz-menu nzMode="horizontal">
      <li nz-menu-item nzSelected>Navigation One</li>
      <li nz-submenu>
        <span title>Navigation Two - Submenu</span>
        <ul>
          <li nz-menu-item>Option 1</li>
          <li nz-menu-item>Option 2</li>
        </ul>
      </li>
      <li nz-menu-item>Navigation Three</li>
    </ul>

    <!-- 垂直菜单 -->
    <ul nz-menu nzMode="vertical">
      <li nz-menu-item>Option 1</li>
      <li nz-menu-item>Option 2</li>
    </ul>

    <!-- 内联菜单 -->
    <ul nz-menu nzMode="inline">
      <li nz-submenu nzOpen nzTitle="Navigation One">
        <ul>
          <li nz-menu-item nzSelected>Option 1</li>
          <li nz-menu-item>Option 2</li>
        </ul>
      </li>
      <li nz-menu-item>Navigation Two</li>
    </ul>
  `
})
export class MenuDemoComponent {}
```

**主要属性**:
- `nzMode`: 模式 (`'vertical' | 'horizontal' | 'inline'`)
- `nzTheme`: 主题 (`'light' | 'dark'`)

### 页头 (PageHeader)

```typescript
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';

@Component({
  imports: [NzPageHeaderModule],
  template: `
    <nz-page-header nzTitle="Title" nzSubtitle="Subtitle">
      <nz-page-header-title>
        <nz-breadcrumb>
          <nz-breadcrumb-item>Home</nz-breadcrumb-item>
          <nz-breadcrumb-item>Application</nz-breadcrumb-item>
        </nz-breadcrumb>
      </nz-page-header-title>
      <nz-page-header-content>
        <div class="content">
          <div class="main">
            <p>Content</p>
          </div>
        </div>
      </nz-page-header-content>
      <nz-page-header-extra>
        <button nz-button nzType="primary">Primary</button>
      </nz-page-header-extra>
    </nz-page-header>
  `
})
export class PageHeaderDemoComponent {}
```

### 步骤条 (Steps)

```typescript
import { NzStepsModule } from 'ng-zorro-antd/steps';

@Component({
  imports: [NzStepsModule],
  template: `
    <nz-steps [nzCurrent]="0">
      <nz-step nzTitle="Finished" nzDescription="This is a description."></nz-step>
      <nz-step nzTitle="In Progress" nzSubTitle="Left 00:00:08" nzDescription="This is a description."></nz-step>
      <nz-step nzTitle="Waiting" nzDescription="This is a description."></nz-step>
    </nz-steps>

    <!-- 小型步骤条 -->
    <nz-steps [nzCurrent]="1" nzSize="small">
      <nz-step nzTitle="Finished"></nz-step>
      <nz-step nzTitle="In Progress"></nz-step>
      <nz-step nzTitle="Waiting"></nz-step>
    </nz-steps>

    <!-- 垂直步骤条 -->
    <nz-steps [nzCurrent]="1" nzDirection="vertical">
      <nz-step nzTitle="Finished"></nz-step>
      <nz-step nzTitle="In Progress"></nz-step>
      <nz-step nzTitle="Waiting"></nz-step>
    </nz-steps>
  `
})
export class StepsDemoComponent {}
```

## 反馈组件

### 警告提示 (Alert)

```typescript
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  imports: [NzAlertModule],
  template: `
    <nz-alert nzType="success" nzMessage="Success Text" nzShowIcon></nz-alert>
    <nz-alert nzType="info" nzMessage="Info Text" nzShowIcon></nz-alert>
    <nz-alert nzType="warning" nzMessage="Warning Text" nzShowIcon></nz-alert>
    <nz-alert nzType="error" nzMessage="Error Text" nzShowIcon></nz-alert>

    <!-- 可关闭警告 -->
    <nz-alert
      nzType="info"
      nzMessage="Info Text"
      nzDescription="Additional description"
      nzCloseable
      nzShowIcon
      (nzOnClose)="onClose()">
    </nz-alert>
  `
})
export class AlertDemoComponent {
  onClose(): void {
    console.log('Alert closed');
  }
}
```

### 抽屉 (Drawer)

```typescript
import { NzDrawerModule } from 'ng-zorro-antd/drawer';

@Component({
  imports: [NzDrawerModule],
  template: `
    <button nz-button nzType="primary" (click)="open()">Open</button>

    <nz-drawer
      [nzClosable]="true"
      [nzVisible]="visible"
      nzPlacement="right"
      nzTitle="Basic Drawer"
      (nzOnClose)="close()">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </nz-drawer>
  `
})
export class DrawerDemoComponent {
  visible = false;

  open(): void {
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }
}
```

**主要属性**:
- `nzVisible`: 可见性
- `nzPlacement`: 位置 (`'left' | 'right' | 'top' | 'bottom'`)
- `nzClosable`: 显示关闭按钮
- `nzMaskClosable`: 点击遮罩关闭

### 模态对话框 (Modal)

```typescript
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  imports: [NzButtonModule, NzModalModule],
  template: `
    <button nz-button nzType="primary" (click)="showModal()">Show Modal</button>
    <button nz-button (click)="showConfirm()">Confirm</button>
  `
})
export class ModalDemoComponent {
  visible = false;

  showModal(): void {
    this.visible = true;
  }

  constructor(private modal: NzModalService) {}

  showConfirm(): void {
    this.modal.confirm({
      nzTitle: 'Do you Want to delete these items?',
      nzContent: 'When clicked the OK button, this dialog will be closed after 1 second',
      nzOnOk: () => new Promise((resolve) => setTimeout(() => resolve(true), 1000))
    });
  }
}
```

**模板方式**:

```html
<nz-modal
  [(nzVisible)]="visible"
  nzTitle="Basic Modal"
  (nzOnCancel)="handleCancel()"
  (nzOnOk)="handleOk()">
  <p>Modal Content</p>
</nz-modal>
```

**服务方式**:

```typescript
import { NzModalService } from 'ng-zorro-antd/modal';

constructor(private modal: NzModalService) {}

showModal(): void {
  this.modal.success({
    nzTitle: 'This is a success message',
    nzContent: 'This is a success message'
  });
}

showInfo(): void {
  this.modal.info({
    nzTitle: 'This is an info message',
    nzContent: 'This is an info message'
  });
}

showError(): void {
  this.modal.error({
    nzTitle: 'This is an error message',
    nzContent: 'This is an error message'
  });
}

showWarning(): void {
  this.modal.warning({
    nzTitle: 'This is a warning message',
    nzContent: 'This is a warning message'
  });
}
```

### 消息提示 (Message)

```typescript
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  template: `
    <button nz-button (click)="showMessage()">Show Message</button>
  `
})
export class MessageDemoComponent {
  constructor(private message: NzMessageService) {}

  showMessage(): void {
    this.message.success('This is a success message');
    this.message.error('This is an error message');
    this.message.info('This is an info message');
    this.message.warning('This is a warning message');
    this.message.loading('Loading...');

    // 自定义配置
    this.message.info('Message with custom duration', { nzDuration: 5000 });
  }
}
```

### 通知提醒框 (Notification)

```typescript
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  template: `
    <button nz-button (click)="showNotification()">Show Notification</button>
  `
})
export class NotificationDemoComponent {
  constructor(private notification: NzNotificationService) {}

  showNotification(): void {
    this.notification.success('Success', 'This is a success message');
    this.notification.error('Error', 'This is an error message');
    this.notification.info('Info', 'This is an info message');
    this.notification.warning('Warning', 'This is a warning message');
    this.notification.blank('Blank', 'This is a blank message');

    // 自定义配置
    this.notification.success(
      'Notification Title',
      'This is the content of the notification.',
      { nzDuration: 5000 }
    );
  }
}
```

### 气泡确认框 (Popconfirm)

```typescript
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  imports: [NzPopconfirmModule],
  template: `
    <a nz-popconfirm nzPopconfirmTitle="Are you sure delete this task?">Delete</a>

    <a
      nz-popconfirm
      nzPopconfirmTitle="Are you sure?"
      nzPopconfirmPlacement="right"
      (nzOnConfirm)="confirm()"
      (nzOnCancel)="cancel()">
      Delete
    </a>
  `
})
export class PopconfirmDemoComponent {
  confirm(): void {
    console.log('Confirmed');
  }

  cancel(): void {
    console.log('Cancelled');
  }
}
```

### 气泡卡片 (Popover)

```typescript
import { NzPopoverModule } from 'ng-zorro-antd/popover';

@Component({
  imports: [NzPopoverModule],
  template: `
    <nz-popover nzTitle="Title" nzContent="Content">
      <a>Hover me</a>
    </nz-popover>

    <nz-popover nzTrigger="click" nzTitle="Title">
      <ng-template #content>
        <p>This is popover content</p>
      </ng-template>
      <a>Click me</a>
    </nz-popover>
  `
})
export class PopoverDemoComponent {}
```

### 进度条 (Spin)

```typescript
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  imports: [NzSpinModule],
  template: `
    <nz-spin nzSimple></nz-spin>
    <nz-spin [nzSpinning]="loading">
      <div class="spin-content">
        Loading content...
      </div>
    </nz-spin>
    <nz-spin [nzSpinning]="loading" nzTip="Loading...">
      <div class="spin-content">
        Loading content...
      </div>
    </nz-spin>
  `
})
export class SpinDemoComponent {
  loading = true;
}
```

## 其他组件

### 上传 (Upload)

```typescript
import { NzUploadModule } from 'ng-zorro-antd/upload';

@Component({
  imports: [NzUploadModule],
  template: `
    <nz-upload
      nzAction="https://www.mocky.io/v2/5cc8019d300000980a055e76"
      [nzHeaders]="headers"
      [nzFileList]="fileList"
      (nzChange)="handleChange($event)">
      <button nz-button><nz-icon nzType="upload"></nz-icon> Click to Upload</button>
    </nz-upload>

    <!-- 拖拽上传 -->
    <nz-upload
      nzType="drag"
      nzAction="https://www.mocky.io/v2/5cc8019d300000980a055e76">
      <p class="ant-upload-drag-icon">
        <nz-icon nzType="inbox"></nz-icon>
      </p>
      <p class="ant-upload-text">Click or drag file to this area to upload</p>
      <p class="ant-upload-hint">Support for a single or bulk upload.</p>
    </nz-upload>
  `
})
export class UploadDemoComponent {
  fileList = [];

  handleChange(info: NzUploadChangeParam): void {
    if (info.file.status === 'done') {
      console.log('Upload success');
    }
  }

  headers = { Authorization: 'authorization-text' };
}
```

### 穿梭框 (Transfer)

```typescript
import { NzTransferModule } from 'ng-zorro-antd/transfer';

@Component({
  imports: [NzTransferModule],
  template: `
    <nz-transfer
      [nzDataSource]="list"
      [nzTitles]="['Source', 'Target']"
      (nzChange)="change($event)">
    </nz-transfer>
  `
})
export class TransferDemoComponent {
  list: any[] = [];
  i = 1;

  ngOnInit(): void {
    for (let i = 0; i < 20; i++) {
      this.list.push({
        key: i.toString(),
        title: `content${i + 1}`,
        description: `description of content${i + 1}`,
        disabled: i % 3 < 1
      });
    }

    [0, 2, 3].forEach(idx => (this.list[idx].direction = 'right'));
  }

  change(ret: {}): void {
    console.log(ret);
  }
}
```

### 卡片 (Card)

```typescript
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  imports: [NzCardModule],
  template: `
    <nz-card
      nzTitle="Card title"
      nzExtra="<a href="#">More</a>"
      [nzBordered]="true"
      [nzHoverable]="true"
      style="width: 300px;">
      <p>Card content</p>
      <p>Card content</p>
      <p>Card content</p>
    </nz-card>

    <!-- 卡片列表 -->
    <div style="background: #ECECEC; padding: 30px;">
      <nz-card nzTitle="Card title" [nzBordered]="false" style="width: 300px;">
        <p>Card content</p>
      </nz-card>
      <nz-card nzTitle="Card title" [nzBordered]="false" style="width: 300px;">
        <p>Card content</p>
      </nz-card>
    </div>
  `
})
export class CardDemoComponent {}
```

### 折叠面板 (Collapse)

```typescript
import { NzCollapseModule } from 'ng-zorro-antd/collapse';

@Component({
  imports: [NzCollapseModule],
  template: `
    <nz-collapse [(nzActiveKey)]="activeKey">
      <nz-collapse-panel
        [nzHeader]="'This is panel header 1'"
        [nzActive]="activeKey.includes('1')">
        <p>{{ text }}</p>
      </nz-collapse-panel>
      <nz-collapse-panel
        [nzHeader]="'This is panel header 2'"
        [nzDisabled]="true">
        <p>This is panel content 2</p>
      </nz-collapse-panel>
      <nz-collapse-panel [nzHeader]="'This is panel header 3'">
        <p>This is panel content 3</p>
      </nz-collapse-panel>
    </nz-collapse>
  `
})
export class CollapseDemoComponent {
  activeKey = ['1'];
  text = `
    A dog is a type of domesticated animal.
    Known for its loyalty and faithfulness,
    it can be found as a welcome guest in many households across the world.
  `;
}
```

### 标签页 (Tabs)

```typescript
import { NzTabsModule } from 'ng-zorro-antd/tabs';

@Component({
  imports: [NzTabsModule],
  template: `
    <nz-tabset>
      <nz-tab nzTitle="Tab 1">Content of Tab 1</nz-tab>
      <nz-tab nzTitle="Tab 2">Content of Tab 2</nz-tab>
      <nz-tab nzTitle="Tab 3">Content of Tab 3</nz-tab>
    </nz-tabset>

    <!-- 可关闭标签 -->
    <nz-tabset nzType="editable" [(nzSelectedIndex)]="selectedIndex">
      <nz-tab
        *ngFor="let tab of tabs"
        [nzTitle]="tab.title"
        [nzClosable]="tab.closable"
        (nzClose)="closeTab(tab)">
        {{ tab.content }}
      </nz-tab>
    </nz-tabset>

    <!-- 卡片式标签 -->
    <nz-tabset nzType="card">
      <nz-tab nzTitle="Tab 1">Content of Tab 1</nz-tab>
      <nz-tab nzTitle="Tab 2">Content of Tab 2</nz-tab>
    </nz-tabset>
  `
})
export class TabsDemoComponent {
  tabs = [
    { title: 'Tab 1', content: 'Content of Tab 1', closable: false },
    { title: 'Tab 2', content: 'Content of Tab 2', closable: true }
  ];

  selectedIndex = 0;

  closeTab(tab: any): void {
    this.tabs = this.tabs.filter(t => t !== tab);
  }
}
```

### 评分 (Rate)

```typescript
import { NzRateModule } from 'ng-zorro-antd/rate';

@Component({
  imports: [NzRateModule],
  template: `
    <nz-rate [(ngModel)]="value"></nz-rate>
    <nz-rate [(ngModel)]="value" nzAllowHalf></nz-rate>
    <nz-rate [(ngModel)]="value" [nzDisabled]="true"></nz-rate>

    <!-- 自定义字符 -->
    <nz-rate [(ngModel)]="value" nzAllowHalf>
      <ng-template let-star let-index="index">
        @if (star === 'half') {
          <span>★</span>
        } @else {
          <span>☆</span>
        }
      </ng-template>
    </nz-rate>
  `
})
export class RateDemoComponent {
  value = 5;
}
```

### 轮播图 (Carousel)

```typescript
import { NzCarouselModule } from 'ng-zorro-antd/carousel';

@Component({
  imports: [NzCarouselModule],
  template: `
    <nz-carousel nzAutoPlay>
      <div nz-carousel-content><h3>1</h3></div>
      <div nz-carousel-content><h3>2</h3></div>
      <div nz-carousel-content><h3>3</h3></div>
      <div nz-carousel-content><h3>4</h3></div>
    </nz-carousel>
  `,
  styles: [`
    [nz-carousel-content] {
      text-align: center;
      height: 160px;
      line-height: 160px;
      background: #364d79;
      color: #fff;
      overflow: hidden;
    }
  `]
})
export class CarouselDemoComponent {}
```

## 布局组件

### 栅格 (Grid)

```typescript
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  imports: [NzGridModule],
  template: `
    <div nz-row>
      <div nz-col [nzSpan]="12">col-12</div>
      <div nz-col [nzSpan]="12">col-12</div>
    </div>

    <div nz-row [nzGutter]="[16, 24]">
      <div nz-col [nzXs]="{ span: 24, offset: 0 }" [nzSm]="{ span: 11, offset: 1 }" [nzMd]="{ span: 6, offset: 2 }">
        Col
      </div>
      <div nz-col [nzXs]="{ span: 24, offset: 0 }" [nzSm]="{ span: 11, offset: 1 }" [nzMd]="{ span: 6, offset: 2 }">
        Col
      </div>
    </div>
  `
})
export class GridDemoComponent {}
```

### 布局 (Layout)

```typescript
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  imports: [NzLayoutModule],
  template: `
    <nz-layout class="layout">
      <nz-sider>Sider</nz-sider>
      <nz-layout>
        <nz-header>Header</nz-header>
        <nz-content>Content</nz-content>
        <nz-footer>Footer</nz-footer>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .layout {
      height: 100vh;
    }
    nz-sider {
      background: #001529;
      color: #fff;
      line-height: 120px;
    }
    nz-header {
      background: #7dbcea;
      color: #fff;
      line-height: 64px;
    }
    nz-content {
      background: rgba(16, 142, 233, 0.6);
      color: #fff;
      line-height: 120px;
    }
    nz-footer {
      background: #7dbcea;
      color: #fff;
      line-height: 64px;
    }
  `]
})
export class LayoutDemoComponent {}
```

### 空状态 (Empty)

```typescript
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  imports: [NzEmptyModule],
  template: `
    <nz-empty></nz-empty>

    <nz-empty nzNotFoundContent="Customize Not Found Data"></nz-empty>

    <nz-empty [nzNotFoundContent]="'Customize Not Found Data'">
      <ng-template #notFoundContent>
        <span>Customize Not Found Data</span>
      </ng-template>
    </nz-empty>
  `
})
export class EmptyDemoComponent {}
```

## 国际化

NG-ZORRO 支持国际化，可以切换语言。

```typescript
import { en_US, zh_CN, NzI18nService } from 'ng-zorro-antd/i18n';

@Component({...})
export class AppComponent {
  constructor(private i18n: NzI18nService) {}

  switchLanguage(lang: string): void {
    if (lang === 'en') {
      this.i18n.setLocale(en_US);
    } else if (lang === 'zh') {
      this.i18n.setLocale(zh_CN);
    }
  }
}
```

## 主题定制

NG-ZORRO 支持通过修改 CSS 变量来定制主题。

```css
/* styles.css */
:host {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  --info-color: #1890ff;
}
```

## 最佳实践

1. **使用 TypeScript**: 充分利用 TypeScript 的类型系统，定义清晰的接口
2. **响应式表单**: 对于复杂表单，优先使用响应式表单
3. **按需加载**: 只导入实际使用的组件模块
4. **国际化**: 从一开始就考虑国际化支持
5. **主题定制**: 使用 CSS 变量进行主题定制，而不是覆盖大量样式
6. **表单验证**: 使用 NG-ZORRO 的表单验证功能，提供友好的错误提示
7. **性能优化**: 对于大量数据，使用虚拟滚动和懒加载
8. **可访问性**: 确保 UI 组件符合可访问性标准
9. **移动端适配**: 使用响应式布局和移动端友好的组件
10. **错误处理**: 在异步操作中添加适当的错误处理和用户反馈

## 常用模块和包

```typescript
// 通用组件
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

// 表单组件
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzUploadModule } from 'ng-zorro-antd/upload';

// 数据展示
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzCardModule } from 'ng-zorro-antd/card';

// 导航
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

// 反馈
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// 布局
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

// 其他
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

// 服务
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzI18nService } from 'ng-zorro-antd/i18n';
```

## 参考资源

- NG-ZORRO 官方文档: https://ng.ant.design/
- NG-ZORRO GitHub: https://github.com/NG-ZORRO/ng-zorro-antd
- Ant Design 设计语言: https://ant.design/
