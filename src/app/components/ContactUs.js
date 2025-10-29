'use client';
import React, { useEffect, useState } from 'react';
import useLocale from '@/app/hooks/useLocale';
import Link from 'next/link';

export default function ContactUs() {
  const { localeDict, currentLocale } = useLocale();
  const locale = localeDict.components.ContactUs;

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msgKey, setMsgKey] = useState(null);

  const pickLocalized = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value[currentLocale] ?? value.zh ?? value.en ?? Object.values(value)[0] ?? '';
    }
    return '';
  };

  // === 取得聯絡資訊 ===
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/contact', { cache: 'no-store' });
        const data = await res.json();
        setContact(data);
      } catch (err) {
        console.error('載入聯絡資訊失敗:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // === 表單送出 ===
  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setMsgKey(null);

    const form = e.target;
    const payload = {
      company: form.company.value.trim(),
      name: form.person.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      location: form.address.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsgKey('success');
      form.reset();
    } catch (err) {
      setMsgKey('error');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section className='bg-neutral-900 text-white py-40 px-6'>
        <div className='max-w-6xl mx-auto text-center opacity-60'>
          {locale.messages.loading}
        </div>
      </section>
    );
  }

  const address = pickLocalized(contact?.address);
  const phone = contact?.phone || '';
  const email = contact?.email || '';
  const hoursRange = contact?.hours
    ? `${contact.hours.open || ''} ~ ${contact.hours.close || ''}`.trim()
    : '';
  const hours = hoursRange || locale.table.hoursDefault;
  const instagram = contact?.instagram || '#';
  const facebook = contact?.facebook || '#';
  const colon = currentLocale === 'zh' ? '：' : ':';
  const messageText = msgKey ? locale.messages[msgKey] : '';
  const messageClass = msgKey === 'error' ? 'text-red-400' : 'text-green-400';

  return (
    <section className='bg-neutral-900 text-white py-40 px-6'>
      <div className='max-w-6xl mx-auto'>
        {/* 標題 */}
        <div className='text-center mb-20'>
          <h2 className='text-3xl md:text-4xl font-semibold tracking-wide'>{locale.title}</h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
          {/* 表單 */}
          <form className='space-y-4' onSubmit={handleSubmit}>
            <input name='company' type='text' placeholder={locale.form.company} className='w-full p-3 rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition' />
            <input name='person' type='text' placeholder={locale.form.person} className='w-full p-3 rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition' required />
            <input name='phone' type='text' placeholder={locale.form.phone} className='w-full p-3 rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition' />
            <input name='email' type='email' placeholder={locale.form.email} className='w-full p-3 rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition' required />
            <input name='address' type='text' placeholder={locale.form.address} className='w-full p-3 rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition' />
            <textarea name='message' rows='5' placeholder={locale.form.message} className='w-full p-3 rounded-3xl bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition' required />
            <button
              type='submit'
              disabled={sending}
              className='w-full py-3 rounded-full bg-white text-black font-medium select-none hover:bg-neutral-200 hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer'
            >
              {sending ? locale.messages.sending : (locale.form.submit || 'Send')}
            </button>
            {messageText && <div className={`text-center text-sm mt-2 ${messageClass}`}>{messageText}</div>}
          </form>

          {/* 右側聯絡資訊 */}
          <div className='flex flex-col gap-4 text-neutral-300'>
            <table className='w-full text-left border-separate border-spacing-y-2'>
              <tbody>
                {address && (
                  <tr>
                    <td className='text-sm text-neutral-400 w-24 md:w-28'>{`${locale.table.address}${colon}`}</td>
                    <td className='font-bold'>{address}</td>
                  </tr>
                )}
                {phone && (
                  <tr>
                    <td className='text-sm text-neutral-400 w-24 md:w-28'>{`${locale.table.phone}${colon}`}</td>
                    <td className='font-bold'>{phone}</td>
                  </tr>
                )}
                {email && (
                  <tr>
                    <td className='text-sm text-neutral-400 w-24 md:w-28'>{`${locale.table.email}${colon}`}</td>
                    <td className='font-bold'>{email}</td>
                  </tr>
                )}
                {hours && (
                  <tr>
                    <td className='text-sm text-neutral-400 w-24 md:w-28'>{`${locale.table.hours}${colon}`}</td>
                    <td className='font-bold'>{hours}</td>
                  </tr>
                )}
              </tbody>
            </table>


            {/* 社群連結 */}
            <div className='flex items-center space-x-4 select-none'>
              <Link href={instagram} target='_blank' rel='noopener noreferrer' className='hover:text-white underline underline-offset-4 flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'>
                <img src='/ig-logo.png' alt='Instagram' className='size-8' />
                <span className='text-sm'>{locale.links.instagram}</span>
              </Link>
              <Link href={facebook} target='_blank' rel='noopener noreferrer' className='hover:text-white underline underline-offset-4 flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'>
                <img src='/fb-logo.png' alt='Facebook' className='size-8' />
                <span className='text-sm'>{locale.links.facebook}</span>
              </Link>
            </div>

            {/* 地圖 */}
            <div className='mt-4 flex-1'>
              <iframe
                title='map'
                src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d909.2531978113798!2d120.78860447540106!3d24.276283759884297!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34691b00503d5bcf%3A0x48dee2b65488ad76!2z6Zi_5pyo5Y-4!5e0!3m2!1szh-TW!2stw!4v1761664194529!5m2!1szh-TW!2stw'
                width='100%'
                allowFullScreen=''
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
                className='rounded-3xl h-full outline outline-white/15'
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}