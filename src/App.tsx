import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductManager from './pages/admin/ProductManager'
import DiscountManager from './pages/admin/DiscountManager'
import QrManager from './pages/admin/QrManager'
import CashSales from './pages/admin/CashSales'

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#242424', color: '#FFFFFF', border: '1px solid #333333' },
          success: { iconTheme: { primary: '#4CAF50', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#F44336', secondary: '#FFFFFF' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <CartProvider>
                  <Layout />
                </CartProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <ProductManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/discounts"
              element={
                <AdminRoute>
                  <DiscountManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/qr"
              element={
                <AdminRoute>
                  <QrManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/cash-sales"
              element={
                <AdminRoute>
                  <CashSales />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
