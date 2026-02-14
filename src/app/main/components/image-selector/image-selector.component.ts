import {Component, Input, OnInit, forwardRef} from '@angular/core';
import axios from 'axios';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {IconService} from '../../../service/icon.service';
import {dialog} from '@electron/remote';

@Component({
  selector: 'app-image-selector',
  templateUrl: './image-selector.component.html',
  styleUrl: './image-selector.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageSelectorComponent),
      multi: true,
    },
  ],
})
export class ImageSelectorComponent implements ControlValueAccessor, OnInit {
  source_ = 0;
  value: string | null = '';
  disable = false;
  baiduResults = [] as string[];

  @Input()
  searchKeyWord = '';

  get source() {
    return this.source_;
  }

  set source(value: number) {
    this.source_ = value;
    this.value = null;
    this.onChange(this.value);
  }

  onChange = (_: string | null) => { };
  onTouch = () => { };

  writeValue(obj: string): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disable = isDisabled;
  }

  sourceOptions = [
    {label: '本地图片', value: 'local'},
    {label: '百度搜索', value: 'baidu'},
  ];
  searchPageIndex = 1;

  constructor(
    public iconService: IconService,
  ) {
  }

  ngOnInit() {
    this.searchBaidu();
  }

  async searchBaidu() {
    this.searchPageIndex = 1;
    const keyword = this.searchKeyWord.replaceAll(' ', '+');
    const res = await axios.get(`https://image.baidu.com/search/acjson?tn=resultjson_com&hd=1&ipn=rj&word=${keyword}&pn=`, {
      responseType: 'text',
    });
    const match = /\"middleURL\":\"(http.+?)\"/g;

    const result: string[] = [];
    let matched: RegExpExecArray | null = null;
    do {
      matched = match.exec(res.data);
      if (matched) {
        result.push(matched[1]);
      }
    } while (matched);

    this.baiduResults = result;
  }

  selectSearchImage(img: string) {
    if (img === this.value) {
      this.value = null;
    } else {
      this.value = img;
    }
    this.onChange(this.value);
  }

  async openImageSelectDialog() {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '请选择游戏封面图片',
      filters: [
        {name: '图片文件', extensions: ['png', 'jpg']},
      ],
    });
    if (res.canceled) {
      return;
    }

    if (res.filePaths && res.filePaths.length) {
      this.value = `file:///${res.filePaths[0].replaceAll('\\', '/')}`;
      this.onChange(this.value);
    }
  }
}
