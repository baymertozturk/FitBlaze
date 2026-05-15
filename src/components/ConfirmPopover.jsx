import { FiTrash2 } from 'react-icons/fi'
import './ConfirmPopover.css'

export default function ConfirmPopover({ title, onConfirm, onCancel, placement = 'right' }) {
  return (
    <>
      <div className="confirm-popover-backdrop" onClick={onCancel} />
      <div className={`confirm-popover confirm-popover-${placement}`} role="dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-popover-icon"><FiTrash2 /></div>
        <div className="confirm-popover-body">
          <div className="confirm-popover-title">{title}</div>
          <div className="confirm-popover-actions">
            <button type="button" className="confirm-popover-cancel" onClick={onCancel}>İptal</button>
            <button type="button" className="confirm-popover-delete" onClick={onConfirm}>Sil</button>
          </div>
        </div>
      </div>
    </>
  )
}
