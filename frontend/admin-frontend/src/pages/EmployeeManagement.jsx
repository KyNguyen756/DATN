import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { employeeService } from '../services/employeeService';
import './Management.css';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    form.resetFields();
    setIsEditing(false);
    setCurrentEmployee(null);
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setIsEditing(true);
    setCurrentEmployee(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await employeeService.delete(id);
      message.success('Xóa nhân viên thành công');
      fetchEmployees();
    } catch (error) {
      message.error('Không thể xóa nhân viên');
      console.error(error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing) {
        await employeeService.update(currentEmployee.id, values);
        message.success('Cập nhật nhân viên thành công');
      } else {
        await employeeService.create(values);
        message.success('Thêm nhân viên thành công');
      }
      setIsModalVisible(false);
      fetchEmployees();
    } catch (error) {
      message.error('Có lỗi xảy ra');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Mã nhân viên',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roles = {
          admin: 'Quản trị viên',
          manager: 'Quản lý',
          staff: 'Nhân viên',
        };
        return roles[role] || role;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'active' ? '#52c41a' : '#f5222d' }}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa nhân viên này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteClick(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="management-page">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="page-header">
            <h1>Quản lý nhân viên</h1>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large">
              Thêm nhân viên mới
            </Button>
          </div>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={employees}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={isEditing ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="0123456789" />
          </Form.Item>
          <Form.Item
            label="Chức vụ"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
          >
            <Select placeholder="Chọn chức vụ">
              <Select.Option value="admin">Quản trị viên</Select.Option>
              <Select.Option value="manager">Quản lý</Select.Option>
              <Select.Option value="staff">Nhân viên</Select.Option>
            </Select>
          </Form.Item>
          {!isEditing && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
