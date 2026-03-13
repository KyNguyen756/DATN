import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  message,
  Space,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import { busService } from '../services/busService';
import { routeService } from '../services/routeService';
import './Management.css';

export default function TripManagement() {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTrips();
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getAll();
      setTrips(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách chuyến xe');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await busService.getAll();
      setBuses(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await routeService.getAll();
      setRoutes(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddClick = () => {
    form.resetFields();
    setIsEditing(false);
    setCurrentTrip(null);
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setIsEditing(true);
    setCurrentTrip(record);
    form.setFieldsValue({
      ...record,
      departureTime: dayjs(record.departureTime),
      date: dayjs(record.date),
    });
    setIsModalVisible(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await tripService.delete(id);
      message.success('Xóa chuyến xe thành công');
      fetchTrips();
    } catch (error) {
      message.error('Không thể xóa chuyến xe');
      console.error(error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        departureTime: values.departureTime.format('HH:mm'),
      };
      if (isEditing) {
        await tripService.update(currentTrip.id, data);
        message.success('Cập nhật chuyến xe thành công');
      } else {
        await tripService.create(data);
        message.success('Tạo chuyến xe thành công');
      }
      setIsModalVisible(false);
      fetchTrips();
    } catch (error) {
      message.error('Có lỗi xảy ra');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Xe',
      dataIndex: 'busId',
      key: 'busId',
      render: (busId) => {
        const bus = buses.find((b) => b.id === busId);
        return bus?.licensePlate || busId;
      },
    },
    {
      title: 'Tuyến đường',
      dataIndex: 'routeId',
      key: 'routeId',
      render: (routeId) => {
        const route = routes.find((r) => r.id === routeId);
        return route ? `${route.startLocation} - ${route.endLocation}` : routeId;
      },
    },
    {
      title: 'Ngày khởi hành',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ khởi hành',
      dataIndex: 'departureTime',
      key: 'departureTime',
    },
    {
      title: 'Giá vé',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString()} VND`,
    },
    {
      title: 'Hành động',
      key: 'action',
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
            description="Bạn có chắc chắn muốn xóa chuyến xe này?"
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
            <h1>Quản lý chuyến xe</h1>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large">
              Tạo chuyến xe mới
            </Button>
          </div>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={trips}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditing ? 'Cập nhật chuyến xe' : 'Tạo chuyến xe mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Xe"
            name="busId"
            rules={[{ required: true, message: 'Vui lòng chọn xe' }]}
          >
            <Select placeholder="Chọn xe">
              {buses.map((bus) => (
                <Select.Option key={bus.id} value={bus.id}>
                  {bus.licensePlate} - {bus.type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Tuyến đường"
            name="routeId"
            rules={[{ required: true, message: 'Vui lòng chọn tuyến đường' }]}
          >
            <Select placeholder="Chọn tuyến đường">
              {routes.map((route) => (
                <Select.Option key={route.id} value={route.id}>
                  {route.startLocation} - {route.endLocation}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Ngày khởi hành"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            label="Giờ khởi hành"
            name="departureTime"
            rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item
            label="Giá vé (VND)"
            name="price"
            rules={[{ required: true, message: 'Vui lòng nhập giá vé' }]}
          >
            <InputNumber min={0} step={1000} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả chuyến xe..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
