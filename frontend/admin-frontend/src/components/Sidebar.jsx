import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  CarOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const { Sider } = Layout;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/buses',
      icon: <ShoppingOutlined />,
      label: 'Quản lý xe',
    },
    {
      key: '/routes',
      icon: <EnvironmentOutlined />,
      label: 'Quản lý tuyến đường',
    },
    {
      key: '/trips',
      icon: <CarOutlined />,
      label: 'Quản lý chuyến xe',
    },
    {
      key: '/tickets',
      icon: <FileTextOutlined />,
      label: 'Quản lý vé',
    },
    {
      key: '/passengers',
      icon: <UserOutlined />,
      label: 'Quản lý hành khách',
    },
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: 'Quản lý nhân viên',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      theme="dark"
      className="sidebar"
    >
      <div className="logo">
        <h2>{collapsed ? 'BTS' : 'Bus Ticket System'}</h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={(e) => navigate(e.key)}
      />
      <div className="sidebar-footer">
        <Menu
          theme="dark"
          mode="inline"
          onClick={handleLogout}
          items={[
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Đăng xuất',
            },
          ]}
        />
      </div>
    </Sider>
  );
}
