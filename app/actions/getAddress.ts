'use server';

interface AddressResult {
  prefecture: string;
  city: string;
  address: string;
  error?: string;
}

export async function getAddressByZip(zip: string): Promise<AddressResult | null> {
  // 移除所有非数字字符
  const cleanZip = zip.replace(/[^\d]/g, '');

  if (cleanZip.length !== 7) {
    return null;
  }

  try {
    // 使用 zipcloud API (免费、无需 Key、高可用)
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanZip}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'force-cache', // 邮编数据变化不频繁，可以缓存
    });

    if (!res.ok) throw new Error('API Error');

    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        prefecture: result.address1, // 都道府県
        city: result.address2,       // 市区町村
        address: result.address3,    // 町域
      };
    } else {
      return { prefecture: '', city: '', address: '', error: '該当する住所が見つかりませんでした' };
    }
  } catch (error) {
    console.error('Postal Code Fetch Error:', error);
    return null;
  }
}