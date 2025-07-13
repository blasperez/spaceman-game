import React, { useState } from 'react';
import { User, MapPin, FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface UserProfileFormProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    country: string | null;
    city: string | null;
    address: string | null;
    document_type: string | null;
    document_number: string | null;
    kyc_status: 'pending' | 'verified' | 'rejected';
  };
  onUpdate: (updates: any) => Promise<void>;
  onClose: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onUpdate,
  onClose
}) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone_number: user.phone_number || '',
    date_of_birth: user.date_of_birth || '',
    country: user.country || '',
    city: user.city || '',
    address: user.address || '',
    document_type: user.document_type || '',
    document_number: user.document_number || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await onUpdate(formData);
      setMessage('Perfil actualizado exitosamente');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      setMessage('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getKycStatusColor = () => {
    switch (user.kyc_status) {
      case 'verified':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    }
  };

  const getKycStatusIcon = () => {
    switch (user.kyc_status) {
      case 'verified':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <AlertCircle size={16} />;
      default:
        return <Shield size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <User size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">Información de Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <span className="text-white text-2xl">×</span>
          </button>
        </div>

        {/* KYC Status */}
        <div className="p-6 border-b border-white/10">
          <div className={`flex items-center space-x-2 p-3 rounded-xl border ${getKycStatusColor()}`}>
            {getKycStatusIcon()}
            <span className="font-medium">
              Estado KYC: {user.kyc_status === 'verified' ? 'Verificado' : 
                          user.kyc_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
            </span>
          </div>
          <p className="text-white/70 text-sm mt-2">
            La verificación KYC es requerida para retirar dinero real
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <User size={20} />
              <span>Información Básica</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <MapPin size={20} />
              <span>Dirección</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm">País</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Tu país"
                  required
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm">Ciudad</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Tu ciudad"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm">Dirección Completa</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                placeholder="Calle, número, apartamento"
                required
              />
            </div>
          </div>

          {/* Document Information */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <FileText size={20} />
              <span>Documento de Identidad</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm">Tipo de Documento</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                  className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base focus:border-blue-400/50 focus:outline-none"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="passport">Pasaporte</option>
                  <option value="national_id">Cédula Nacional</option>
                  <option value="driver_license">Licencia de Conducir</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="text-white/70 text-sm">Número de Documento</label>
                <input
                  type="text"
                  value={formData.document_number}
                  onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                  className="w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-3 text-white text-base placeholder-white/50 focus:border-blue-400/50 focus:outline-none"
                  placeholder="Número del documento"
                  required
                />
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-xl text-sm ${
              message.includes('exitosamente') 
                ? 'text-green-400 bg-green-400/10 border border-green-400/30' 
                : 'text-red-400 bg-red-400/10 border border-red-400/30'
            }`}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl active:scale-95 shadow-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 disabled:bg-gray-500/80 backdrop-blur-md border border-blue-400/30 text-white py-3 rounded-xl active:scale-95 shadow-lg"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};