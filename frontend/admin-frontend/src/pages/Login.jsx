import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate('/dashboard', { replace: true });
        }
      } catch {}
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login-admin`, {
        username: values.username,
        email: values.username,
        password: values.password,
      });
      const { token, user } = res.data;
      if (user.role !== 'admin') {
        message.error('Chỉ quản trị viên mới được đăng nhập trang quản trị');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      message.success('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data || 'Sai tên đăng nhập hoặc mật khẩu';
      message.error(typeof msg === 'string' ? msg : msg.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card
        title="Đăng nhập Admin"
        style={{ width: 400 }}
      >
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            label="Tên đăng nhập / Email"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input placeholder="admin@example.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="********" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
