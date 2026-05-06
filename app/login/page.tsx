'use client'

import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd'
import { ThunderboltOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ConfigProvider } from 'antd'
import { fitStackTheme } from '@/lib/antd-theme'

const { Title, Text } = Typography

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(values: { email: string; password: string }) {
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    setLoading(false)
    if (!result) {
      setError('Something went wrong. Please try again.')
    } else if (result.error) {
      setError('Invalid email or password')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <ConfigProvider theme={fitStackTheme}>
      <div
        style={{
          minHeight: '100vh',
          background: '#F5F5F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: '#1677FF', fontSize: 28 }} />
              <Title level={2} style={{ margin: 0, color: '#1677FF' }}>FitStack</Title>
            </div>
            <br />
            <Text type="secondary">Workout management for trainers and clients</Text>
          </div>

          <Card>
            <Title level={4} style={{ marginBottom: 24, textAlign: 'center' }}>Sign in</Title>

            {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}

            <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="trainer@fitstack.app" size="large" />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Password required' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Sign in
                </Button>
              </Form.Item>
            </Form>

            <div style={{ marginTop: 24, padding: '12px 16px', background: '#F5F5F5', borderRadius: 6 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Demo accounts:</Text>
              <Text style={{ fontSize: 12, display: 'block' }}>Trainer: trainer@fitstack.app / trainer123</Text>
              <Text style={{ fontSize: 12, display: 'block' }}>Client: client@fitstack.app / client123</Text>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  )
}
