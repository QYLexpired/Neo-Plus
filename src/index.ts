import { Plugin } from 'siyuan';
import { NeoPlusController } from './main/controller';
export default class NeoPlusPlugin extends Plugin {
  private controller: NeoPlusController | null = null;
  onload(): void {
    this.controller = new NeoPlusController(this);
    this.controller.init();
  }
  onunload(): void {
    this.controller?.destroy();
    this.controller = null;
  }
  uninstall(): void {}
}
