export interface IOpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'>;
  message?: string;
  securityScopedBookmarks?: boolean;
}

export interface IFileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface DialogHandler {
  showOpenDialog(options: IOpenDialogOptions): Promise<IFileDialogResult>;
}
