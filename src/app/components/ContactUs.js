'use client';
import React, { useState } from 'react';
import useLocale from '@/app/hooks/useLocale';

export default function ContactUs() {
  // 依你的規範：固定用這兩行取得字典與 Header 詞彙
  const { localeDict } = useLocale();
  const locale = localeDict.components.ContactUs;

  const [formData, setFormData] = useState({
    company: '',
    person: '',
    phone: '',
    email: '',
    address: '',
    message: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || locale.form.error;
        throw new Error(message);
      }

      setStatus('success');
      setFormData({
        company: '',
        person: '',
        phone: '',
        email: '',
        address: '',
        message: '',
      });
    } catch (err) {
      setStatus('error');
      setError(err.message || locale.form.error);
    }
  };

  return (
    <section className='bg-neutral-900 text-white py-40 px-6'>
      <div className='max-w-6xl mx-auto'>
        {/* 標題 */}
        <div className='text-center mb-20'>
          <h2 className='text-3xl md:text-4xl font-semibold tracking-wide'>{locale.title}</h2>
          <p className='text-sm text-gray-400 mt-2'>
            {/* {locale.company_name ? `— ${locale.company_name} —` : ''} */}
          </p>
        </div>

        {/* 兩欄：表單 / 聯絡資訊 + 地圖 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
          {/* 左：表單 */}
          <form className='space-y-4' onSubmit={handleSubmit}>
            <input
              type='text'
              name='company'
              value={formData.company}
              onChange={handleChange}
              placeholder={locale.form.company}
              className='w-full p-3 select-none rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition'
            />
            <input
              required
              type='text'
              name='person'
              value={formData.person}
              onChange={handleChange}
              placeholder={locale.form.person}
              className='w-full p-3 select-none rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition'
            />
            <input
              type='text'
              name='phone'
              value={formData.phone}
              onChange={handleChange}
              placeholder={locale.form.phone}
              className='w-full p-3 select-none rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition'
            />
            <input
              required
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder={locale.form.email}
              className='w-full p-3 select-none rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition'
            />
            <input
              type='text'
              name='address'
              value={formData.address}
              onChange={handleChange}
              placeholder={locale.form.address}
              className='w-full p-3 select-none rounded-full bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition'
            />
            <textarea
              required
              rows='5'
              name='message'
              value={formData.message}
              onChange={handleChange}
              placeholder={locale.form.message}
              className='w-full p-3 select-none rounded-3xl bg-neutral-800 border border-neutral-600 outline-none focus:border-neutral-400 transition'
            />
            <button
              type='submit'
              disabled={status === 'submitting'}
              className='w-full py-3 select-none rounded-full bg-white text-black font-medium hover:bg-gray-200 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {status === 'submitting' ? locale.form.submitting : locale.form.submit || 'Send'}
            </button>
            <div className='min-h-[1.5rem] text-sm'>
              {status === 'success' && <p className='text-emerald-400'>{locale.form.success}</p>}
              {status === 'error' && <p className='text-red-400'>{error || locale.form.error}</p>}
            </div>
          </form>

          {/* 右：公司資訊 + 社群 + 地圖 */}
          <div className='space-y-4 text-gray-300'>
            <div>
              <p className='font-semibold text-white'>{locale.info.company.value || locale.info.company}</p>
              <p className='mt-1'>
                <span className='text-white'>{locale.info.address.label}</span>
                <span className='ml-2'>{locale.info.address.value}</span>
              </p>
              <p className='mt-1'>
                <span className='text-white'>{locale.info.phone.label}</span>
                <span className='ml-2'>{locale.info.phone.value}</span>
              </p>
              <p className='mt-1'>
                <span className='text-white'>{locale.info.email.label}</span>
                <span className='ml-2'>{locale.info.email.value}</span>
              </p>
              <p className='mt-1'>
                <span className='text-white'>{locale.info.hours.label}</span>
                <span className='ml-2'>{locale.info.hours.value}</span>
              </p>
            </div>

            {/* 社群（可自行換 icon/連結） */}
            <div className='flex items-center space-x-4 pt-2'>
              <a href='#' className='hover:text-white underline underline-offset-4'>Instagram</a>
              <a href='#' className='hover:text-white underline underline-offset-4'>Facebook</a>
            </div>

            {/* Google Maps iframe（示例，可自行替換） */}
            <div className='pt-4'>
              <iframe
                title='map'
                src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.946894203826!2d120.7204!3d24.3093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34693f34cfae6891%3A0x4c3f06d226a4ef!2z5Y-w5Lit5aSn5a246K6y5bGx5LqM!5e0!3m2!1szh-TW!2stw!4v1694691577890!5m2!1szh-TW!2stw'
                width='100%'
                height='230'
                style={{ border: 0 }}
                allowFullScreen=''
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
                className='rounded-3xl'
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
