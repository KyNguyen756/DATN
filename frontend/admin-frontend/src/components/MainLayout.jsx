import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import './MainLayout.css';

const { Content } = Layout;

export default function MainLayout({ children }) {
  return (
    <Layout className="main-layout">
      <Sidebar />
      <Layout>
        <Content className="layout-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
