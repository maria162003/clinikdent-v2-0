/**
 * Función de utilidad para intentar desbloquear una cuenta
 * @param {number} userId - ID del usuario a desbloquear
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.attemptAutoUnlock = async (userId) => {
  try {
    // Verificar estado actual del usuario
    const userQuery = await db.query(
      `SELECT is_locked, account_lock_until, failed_attempts 
       FROM usuarios WHERE id = $1`,
      [userId]
    );

    if (!userQuery.rows.length) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const user = userQuery.rows[0];

    // Si no está bloqueado, no hay nada que hacer
    if (!user.is_locked) {
      return { success: true, message: 'La cuenta no está bloqueada' };
    }

    // Si está bloqueado pero el tiempo ha expirado, desbloqueamos
    if (user.account_lock_until && new Date() > new Date(user.account_lock_until)) {
      await db.query(
        `UPDATE usuarios 
         SET is_locked = FALSE, 
             failed_attempts = 0, 
             account_lock_until = NULL 
         WHERE id = $1`,
        [userId]
      );
      return { 
        success: true, 
        message: 'Cuenta desbloqueada automáticamente por tiempo expirado' 
      };
    }

    // Si aún está dentro del período de bloqueo
    if (user.account_lock_until) {
      const remainingTime = Math.ceil((new Date(user.account_lock_until) - new Date()) / 60000);
      return {
        success: false,
        message: `La cuenta permanecerá bloqueada por ${remainingTime} minutos más`,
        remainingTime
      };
    }

    return { success: false, message: 'La cuenta está bloqueada indefinidamente' };
  } catch (error) {
    console.error('Error en attemptAutoUnlock:', error);
    return { 
      success: false, 
      message: 'Error interno al intentar desbloquear la cuenta' 
    };
  }
};