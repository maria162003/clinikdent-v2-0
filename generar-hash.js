const bcrypt = require('bcrypt');

const password = 'Admin123!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\n=== HASH GENERADO ===');
    console.log('Contraseña:', password);
    console.log('Hash bcrypt:', hash);
    console.log('\n=== SQL PARA SUPABASE ===');
    console.log(`UPDATE usuarios SET contraseña_hash = '${hash}' WHERE correo = 'munozdanielfelipe8@gmail.com';\n`);
  }
});
