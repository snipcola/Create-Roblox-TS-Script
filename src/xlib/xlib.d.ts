interface Button {
  Text?: string;
  Disabled?: boolean;
  Remove?: boolean;
  Func?: Callback;
  DestroyOnClick?: boolean;
  Color?: Color3;
}

interface CreateAlertInfo {
  Title?: string;
  Description?: string;
  Button1?: Button;
  Button2?: Button;
  RemoveIn?: number;
}

interface CreateNotificationAlert {
  Title?: string;
  Description?: string;
  RemoveIn?: number;
}

interface XLib {
  CreateAlert: (Info?: CreateAlertInfo) => void;
  CreateNotification: (Info?: CreateNotificationAlert) => void;
}

declare const XLib: XLib;
export = XLib;
