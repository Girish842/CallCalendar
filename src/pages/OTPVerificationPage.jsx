import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Mail, Building, Phone, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../assets/images/callcalendar-logo.png';
import API_URL from '../utils/constants';
const OTPVerificationPage = () => {
  // State management
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [urlStatus, setUrlStatus] = useState('');
  const [bookingData, setBookingData] = useState({
    id: '',
    name: '',
    email: '',
    bookingCode: '',
    callRegarding: '',
    bookingDate: '',
    bookingSlot: '',
    timezone: '',
    joiningLink: '',
    status: '',
    adminName: '',
    verifyOtpUrl: ''
  });
  
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Get URL parameters
  const getUrlParams = () => {
    const pathParts = window.location.pathname.split('/');
    return {
      bookingId: pathParts[2] || '',
      verifyOtpUrl: pathParts[3] || ''
    };
  };

  // Fetch booking data and generate OTP
  const fetchBookingData = async () => {
    const { bookingId, verifyOtpUrl } = getUrlParams();
    
    if (!bookingId || !verifyOtpUrl) {
      setUrlStatus('Expired');
      setPageLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/helpers/verifyOtpUrl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          verifyOtpUrl
        })
      });

      const data = await response.json();

      if (data.status) {
        setBookingData({
          id: data.booking.id,
          name: data.booking.fld_name,
          email: data.booking.fld_email,
          bookingCode: data.booking.fld_bookingcode,
          callRegarding: data.booking.fld_call_regarding,
          bookingDate: data.booking.fld_booking_date,
          bookingSlot: data.booking.fld_booking_slot,
          timezone: data.booking.fld_timezone,
          joiningLink: data.booking.fld_call_joining_link,
          status: data.booking.fld_call_confirmation_status,
          adminName: data.booking.admin_name,
          verifyOtpUrl: data.booking.fld_verify_otp_url
        });
        
        // Set OTP digits if provided (for development/testing)
        if (data.verifyemailotp) {
          const otpArray = data.verifyemailotp.toString().split('');
          setOtp(otpArray);
        }
        
        setUrlStatus('Valid');
      //  toast.success('Booking details loaded successfully!');
      } else {
        setUrlStatus('Expired');
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
      setUrlStatus('Expired');
      toast.error('Failed to load booking details');
    } finally {
      setPageLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBookingData();
  }, []);

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Handle OTP input
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Validate and submit OTP
const handleSubmit = async () => {
  const otpString = otp.join('');
  const { bookingId } = getUrlParams();
  
  if (otpString.length !== 4) {
    toast.error('Please Enter Complete OTP');
    return;
  }

  setLoading(true);
  const loadingToast = toast.loading('Please Wait!');

  try {
    const response = await fetch(`${API_URL}/api/helpers/validateOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        str2: otpString,
        booking_id: bookingId,
        verify_otp_url: bookingData.verifyOtpUrl
      })
    });

    const result = await response.json(); // always JSON

    toast.dismiss(loadingToast);

    if (!result.status && result.message === "error") {
      toast.error('Something Went Wrong Please Try Again Later!');
    } 
    else if (!result.status && result.message === "other_confirmed") {
      toast('Unfortunately, the time slot has already been booked due to a slight delay in accepting the call. I truly appreciate your flexibility, and we look forward to an alternate suitable time for us to connect soon!\n\nThank you for your understanding!', {
        icon: '⚠️',
        duration: 8000,
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #F59E0B',
          maxWidth: '500px',
        }
      });
      setTimeout(() => {
        window.location.reload();
      }, 8000);
    } 
    else if (!result.status && result.message === "fail") {
      toast.error('Invalid OTP!');
    } 
    else if (result.status) {
      toast.success('OTP Verified Successfully');
      setTimeout(() => {
        window.location.href = `/booking_details/${result.bookingId}`;
      }, 1000);
    } 
    else {
      toast.error('Something Went Wrong Please Try Again Later!');
    }

  } catch (error) {
    console.error('Error validating OTP:', error);
    toast.error('Something Went Wrong Please Try Again Later!');
  } finally {
    setLoading(false);
  }
};


  const getDateParts = () => {
    const formatted = formatDate(bookingData.bookingDate);
    const parts = formatted.split(' ');
    return {
      day: parts[1],
      month: parts[0],
      year: parts[2]
    };
  };

  const { day, month, year } = getDateParts();

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-100 font-sans flex">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column Skeleton */}
          <div className="lg:w-2/3">
            <div className="mb-6">
              <div className="h-8 bg-gray-300 rounded w-48 mb-6 animate-pulse"></div>
              
              {/* Calendar Card Skeleton */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 bg-gray-200 p-6 flex flex-col items-center justify-center relative min-h-44 animate-pulse">
                    <div className="w-16 h-16 bg-gray-300 rounded mb-2"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="bg-gray-400 px-2 py-1 rounded-t w-12 h-6"></div>
                      <div className="bg-gray-300 px-4 py-2 w-16 h-10"></div>
                      <div className="bg-gray-300 px-2 pb-2 rounded-b w-12 h-6"></div>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-6 border-x border-gray-200">
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-4 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-6">
                    <div className="h-6 bg-gray-300 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-32 mb-3 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Email Template Skeleton */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="bg-gray-300 h-4 rounded-t-lg -mx-6 -mt-6 mb-6 animate-pulse"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto mb-6 animate-pulse"></div>
                
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
                  ))}
                </div>
                
                <div className="h-10 bg-gray-300 rounded-full w-24 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading skeleton while fetching data
  if (pageLoading) {
    return (
      <>
        <SkeletonLoader />
        <Toaster position="top-center" reverseOrder={false} />
      </>
    );
  }

  // Show expired message if URL is invalid
  if (urlStatus === 'Expired') {
    return (
      <>
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
          {/* Navbar */}
          <nav className="py-3" style={{ backgroundColor: "rgb(215, 215, 215)" }}>
            <div className="container mx-auto px-4">
              <div className="flex items-center">
                <div className="text-xl  text-gray-800">
                  <img src={logo} alt="Logo" className="mx-auto w-50 ml-[-7px]" />
                </div>
              </div>
            </div>
          </nav>
          <div className="container mx-auto px-4 py-8 flex-1 flex justify-center items-center">
            <div className="flex justify-center items-center">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
                {/* Danger header */}
                <div className="bg-red-600 px-6 py-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-white mr-3" />
                    <h1 className="text-2xl font-bold text-white">Link Expired</h1>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-800 ">Access Denied</span>
                    </div>
                    <p className="text-red-700 mt-2">
                      This verification link is no longer valid or has expired.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Please contact support or request a new verification link to continue.
                    </p>
                    {/* <button 
                      onClick={() => window.location.href = '/'}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Go Back Home
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="bg-gray-900 text-white py-2 fixed bottom-0 w-full">
            <div className="container mx-auto px-4">
              <div className="text-sm">
                All Rights Reserved, Rapid Collaborate, (c) Copyright 2024.
              </div>
            </div>
          </footer>
        </div>
        <Toaster position="top-center" reverseOrder={false} />
      </>
    );
  }

  // Check if call is already confirmed
  if (bookingData.status === 'Call Confirmed by Client') {
    window.location.href = `/booking_details/${bookingData.id}`;
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        {/* Navbar */}
      <nav className="py-3" style={{ backgroundColor: "rgb(215, 215, 215)" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="text-xl  text-gray-800">
              <img src={logo} alt="Logo" className="mx-auto w-50 ml-[-7px]" />
            </div>
          </div>
        </div>
      </nav>
        <div className="container mx-auto px-4 py-4 flex-1">
          
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Call Summary</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Call Summary */}
            <div className="lg:w-2/3">
              <div className="mb-6">
                
                
                {/* Calendar Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                  <div className="flex flex-col md:flex-row">
                    {/* Calendar Visual */}
                    <div className="md:w-1/4 bg-gray-200 p-6 flex flex-col items-center justify-center relative min-h-44">
                      <Calendar className="w-16 h-16 text-gray-600 mb-2" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-white  text-sm bg-red-500 px-2 py-1 rounded-t">
                          {month}
                        </span>
                        <span className="text-2xl font-bold text-gray-800 bg-white px-4 py-2">
                          {day}
                        </span>
                        <span className="text-xs font-bold text-gray-600 bg-white px-2 pb-2 rounded-b">
                          {year}
                        </span>
                      </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="md:w-1/2 p-6 border-x border-gray-200">
                      <h3 className=" text-lg mb-4">{bookingData.callRegarding}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 w-20">Timezone</span>
                          <span>{bookingData.timezone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Agenda */}
                    <div className="md:w-1/2 p-6">
                      <h3 className=" text-lg mb-2">Agenda</h3>
                      <p className="text-sm text-gray-600 mb-3">{formatDate(bookingData.bookingDate)}</p>
                      <p className="text-xs text-gray-500 italic mb-2">No Earlier Events</p>
                      <p className="text-sm ">{bookingData.bookingSlot} {bookingData.callRegarding}</p>
                      <p className="text-xs text-gray-500 italic">No Later Events</p>
                    </div>
                  </div>
                </div>

                {/* Email Template */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="bg-purple-800 h-4 rounded-t-lg -mx-6 -mt-6 mb-6"></div>
                  <div className="prose max-w-none">
                    <p className="mb-4">Hi <span>{bookingData.name}</span>,</p>
                    <p className="mb-4">
                      Your appointment ID: <span>{bookingData.bookingCode}</span> has been confirmed. 
                      Here are the details of your appointment:
                    </p>
                    <p className="mb-4">
                      <em><span>Topic - {bookingData.callRegarding}</span></em>
                    </p>
                    <p className="mb-4">
                      <em><span>
                        {getDayName(bookingData.bookingDate)} {formatDate(bookingData.bookingDate)}, {bookingData.bookingSlot}, {bookingData.timezone}
                        <br />
                        MEETING LINK: <a href={bookingData.joiningLink} className="text-blue-600 hover:underline">
                          {bookingData.joiningLink}
                        </a>
                      </span></em>
                    </p>
                    <p>Thanks,<br />Rapid Collaborate.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - OTP Verification */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                  <h2 className="text-xl  text-gray-800 mb-2">
                    Securely Confirm Your Appointment with Our Expert
                  </h2>
                  <h3 className="text-red-600 text-sm mb-3">
                    Please enter the one time password to verify your account
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    A code has been sent to your email id {bookingData.email}
                  </p>

                  <div>
                    <div className="flex justify-center gap-2 mb-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={inputRefs[index]}
                          type="tel"
                          maxLength="1"
                          className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg  focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          disabled={loading}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-red-600 text-white px-8 py-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-2">
          <div className="container mx-auto px-4">
            <div className="text-sm">
              All Rights Reserved, Rapid Collaborate, (c) Copyright 2024.
            </div>
          </div>
        </footer>
      </div>
      
    
    </>
  );
};

export default OTPVerificationPage;