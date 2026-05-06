import { ThemeConfig } from 'antd'

export const fitStackTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677FF',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorInfo: '#1677FF',

    colorBgBase: '#FFFFFF',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
    colorBgElevated: '#FFFFFF',

    colorTextBase: '#000000',
    colorText: 'rgba(0,0,0,0.88)',
    colorTextSecondary: 'rgba(0,0,0,0.45)',
    colorTextTertiary: 'rgba(0,0,0,0.25)',
    colorTextDisabled: 'rgba(0,0,0,0.25)',

    colorBorder: '#D9D9D9',
    colorBorderSecondary: '#F0F0F0',

    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    fontFamily: `-apple-system, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif`,
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    lineHeight: 1.5714,

    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,

    paddingContentVertical: 12,
    paddingContentHorizontal: 16,

    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',

    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#FFFFFF',
      triggerBg: '#002140',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000C17',
      darkItemSelectedBg: '#1677FF',
      darkItemHoverBg: 'rgba(255,255,255,0.08)',
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemSelectedColor: '#FFFFFF',
    },
    Table: {
      headerBg: '#FAFAFA',
      rowHoverBg: '#F5F5F5',
      borderColor: '#F0F0F0',
    },
    Card: {
      paddingLG: 24,
    },
    Statistic: {
      contentFontSize: 24,
    },
    Badge: {
      statusSize: 6,
    },
    Tag: {
      defaultBg: '#FAFAFA',
    },
  },
}
