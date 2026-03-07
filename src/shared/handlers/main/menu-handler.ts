export interface IElectronMenuItem {
  id?: string;
  label?: string;
  icon?: {
    path: string;
    width: number;
    height: number;
  };
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
}

export interface MenuHandler {
  popMenu(body: IElectronMenuItem[]): Promise<void>;
}
