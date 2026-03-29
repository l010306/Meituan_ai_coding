import React from 'react';
import { Users, Info } from 'lucide-react';

const MyClubs: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        color: 'var(--primary)',
        boxShadow: 'var(--shadow)'
      }}>
        <Users size={40} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
        我的社团
      </h2>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: 'var(--item-hover)',
        borderRadius: '12px',
        color: 'var(--primary)',
        fontSize: '14px',
        fontWeight: 600,
        border: '1px solid var(--glass-border)'
      }}>
        <Info size={16} />
        功能拓展中，敬请期待
      </div>
      <p style={{ marginTop: '16px', fontSize: '14px', maxWidth: '300px', lineHeight: 1.6 }}>
        这里未来将展示您已加入的社团、社团内部通知以及成员风采展示。
      </p>
    </div>
  );
};

export default MyClubs;
