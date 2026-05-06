'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Grid } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  ThunderboltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

const { Sider, Header, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const trainerMenuItems = [
  { key: '/trainer/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/trainer/clients', icon: <TeamOutlined />, label: 'Clients' },
  { key: '/trainer/programs', icon: <AppstoreOutlined />, label: 'Programs' },
  { key: '/trainer/exercise-library', icon: <BookOutlined />, label: 'Exercise Library' },
]

const clientMenuItems = [
  { key: '/client/dashboard', icon: <CalendarOutlined />, label: 'Today' },
  { key: '/client/history', icon: <HistoryOutlined />, label: 'History' },
  { key: '/client/profile', icon: <UserOutlined />, label: 'Profile' },
]

export default function AppLayout({ children, role }: { children: React.ReactNode; role: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const menuItems = role === 'TRAINER' ? trainerMenuItems : clientMenuItems

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      onClick: () => signOut({ callbackUrl: '/login' }),
    },
  ]

  const userName = session?.user?.name || ''
  const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  if (isMobile) {
    const activeKey = menuItems.find((item) => pathname.startsWith(item.key))?.key || ''
    return (
      <Layout className="fitstack-layout">
        <Header className="fitstack-header" style={{ height: 56, lineHeight: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#1677FF', fontSize: 20 }} />
            <Text strong style={{ fontSize: 16 }}>FitStack</Text>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} style={{ background: '#1677FF' }}>{initials}</Avatar>
            </div>
          </Dropdown>
        </Header>
        <Content className="fitstack-content content-with-bottom-nav">
          {children}
        </Content>
        <nav className="fitstack-bottom-nav">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.key}
              className={`fitstack-bottom-nav-item${activeKey === item.key ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </Layout>
    )
  }

  return (
    <Layout className="fitstack-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="fitstack-sider"
        theme="dark"
        width={220}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? 0 : '0 24px', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#1677FF', fontSize: 20 }} />
          {!collapsed && <Text strong style={{ color: '#fff', fontSize: 16 }}>FitStack</Text>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => router.push(item.key),
          }))}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header className="fitstack-header">
          <div
            style={{ cursor: 'pointer', fontSize: 16 }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} style={{ background: '#1677FF' }}>{initials}</Avatar>
              <Text>{userName}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content className="fitstack-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
