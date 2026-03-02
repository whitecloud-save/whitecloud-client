import {Injectable} from '@angular/core';
import {faFolder, faStar, faRotateRight, faTrash, faCircleQuestion, faImage, faPen, faDownload, faUpload} from '@fortawesome/pro-light-svg-icons';
import {faLink, faPlus, faFileCircleXmark, faEllipsis, faFolder as solidFaFolder, faStar as SolidStar, faBadgeCheck, faCircleCheck, faCheck, faPlay, faGear, faExclamation, faGamepad, faServer, faFile, faClock, faUser, faCrown, faArrowRight, faCloudArrowUp, faCloudArrowDown, faCircleExclamation} from '@fortawesome/pro-solid-svg-icons';
import {faQq, faGithub} from '@fortawesome/free-brands-svg-icons';

@Injectable({
  providedIn: 'root',
})
export class IconService {

  public light = {
    faFolder,
    faStar,
    faRotateRight,
    faTrash,
    faCircleQuestion,
    faImage,
    faPen,
    faDownload,
    faUpload,
  };

  public solid = {
    faPlus,
    faFolder: solidFaFolder,
    faBadgeCheck,
    faCircleCheck,
    faCheck,
    faPlay,
    faGear,
    faStar: SolidStar,
    faExclamation,
    faGamepad,
    faServer,
    faFile,
    faClock,
    faFileCircleXmark,
    faEllipsis,
    faUser,
    faCrown,
    faArrowRight,
    faCloudArrowUp,
    faCloudArrowDown,
    faCircleExclamation,
    faLink,
  };

  public brands = {
    faQq,
    faGithub,
  }

  constructor() { }
}
