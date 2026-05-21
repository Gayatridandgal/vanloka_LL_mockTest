function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog" aria-modal="true" role="dialog" aria-labelledby="confirm-title">
        <div className={`confirm-icon ${danger ? 'danger' : ''}`} aria-hidden="true">{danger ? '!' : '?'}</div>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn outline" onClick={onCancel} type="button">{cancelLabel}</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
