const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function upload() {
  const file = fs.readFileSync('harina_pan.png');
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload('harina-pan.png', file, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Error uploading:', error);
    process.exit(1);
  }
  console.log('Upload successful:', data);
  
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl('harina-pan.png');
    
  console.log('Public URL:', publicUrl);
}

upload();
