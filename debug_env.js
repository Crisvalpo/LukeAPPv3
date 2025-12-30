// Debug script para verificar variables de entorno en el cliente
// Agregar temporalmente a la página de aceptación para debug

console.log('🔍 DEBUG: Environment Variables Check')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
console.log('First 20 chars of key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20))
