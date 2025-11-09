import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔐 Generating self-signed SSL certificates...\n');

// Check if certificates already exist
if (fs.existsSync('./key.pem') && fs.existsSync('./cert.pem')) {
  console.log('✅ Certificates already exist!');
  console.log('   - key.pem');
  console.log('   - cert.pem');
  console.log('\nTo regenerate, delete the existing files first.');
  process.exit(0);
}

try {
  // Try to generate certificate using OpenSSL
  const command = 'openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=PH/ST=Manila/L=Manila/O=Juander/CN=localhost"';
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ SSL certificates generated successfully!');
  console.log('   - key.pem (private key)');
  console.log('   - cert.pem (certificate)');
  console.log('\n📝 Note: These are self-signed certificates for development only.');
  console.log('   You will see a security warning in your browser - this is normal.');
  console.log('\n🚀 Now restart your dev server: npm run dev');
  
} catch (error) {
  console.error('\n❌ Error: OpenSSL is not installed or not in PATH.');
  console.error('\n📦 Please install OpenSSL:');
  console.error('   1. Install Git for Windows (includes OpenSSL)');
  console.error('   2. Or download from: https://slproweb.com/products/Win32OpenSSL.html');
  console.error('\n💡 Alternative: The server will run on HTTP without certificates.');
  process.exit(1);
}
