import React, { useState } from 'react';
import { Globe, DollarSign, Facebook, Twitter, Instagram, X, Mail, Phone, ShieldCheck, Heart, Sparkles, AlertCircle } from 'lucide-react';

const Footer = () => {
  const [activeOption, setActiveOption] = useState(null);
  
  // Contact Form States
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLinkClick = (e, optionName) => {
    e.preventDefault();
    setActiveOption(optionName);
    setFormSubmitted(false);
    setContactSubject('');
    setContactMessage('');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFormSubmitted(true);
    }, 1200);
  };

  // Content mapper for footer options
  const renderOptionContent = () => {
    switch (activeOption) {
      case 'Help Center':
        return (
          <div className="space-y-5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Welcome to the StayEase Help Center. Find answers to common questions about booking, cancellations, safety, and listing management.
            </p>
            
            {/* Contact Card */}
            <div className="rounded-2xl border border-neutral-150 p-5 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand animate-pulse" />
                <span>Direct Contact Channels</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="mailto:shubhamshivi2004@gmail.com"
                  className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-neutral-850 dark:border-neutral-700 hover:border-brand transition"
                >
                  <Mail className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-[10px] text-neutral-450 uppercase font-black">Email Support</p>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">shubhamshivi2004@gmail.com</p>
                  </div>
                </a>
                
                <a
                  href="tel:9793768977"
                  className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-neutral-850 dark:border-neutral-700 hover:border-brand transition"
                >
                  <Phone className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-neutral-450 uppercase font-black">24/7 Hotline</p>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">9793768977</p>
                  </div>
                </a>
              </div>

              {/* Inquiry Form */}
              <form onSubmit={handleContactSubmit} className="space-y-3 pt-2 border-t dark:border-neutral-850">
                <h5 className="text-xs font-bold dark:text-white">Submit an Inquiry</h5>
                {formSubmitted ? (
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl text-xs font-semibold dark:bg-green-950/20 dark:text-green-400">
                    Your request was received successfully! We will contact you at your registered email address shortly.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="Subject of inquiry"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border dark:border-neutral-800 dark:bg-neutral-850 dark:text-white outline-none focus:border-brand"
                    />
                    <textarea
                      rows="3"
                      required
                      placeholder="How can we help you today?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border dark:border-neutral-800 dark:bg-neutral-850 dark:text-white outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      {submitting ? 'Submitting...' : 'Send Message'}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        );
      case 'AirCover':
      case 'AirCover for Hosts':
        return (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 text-brand font-black text-lg">
              <ShieldCheck className="h-6 w-6" />
              <span>aircover</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              StayEase AirCover gives you complete, top-to-bottom protection for every stay. It includes damage verification guarantees, booking protection checks, and check-in support guidelines.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 border rounded-xl dark:border-neutral-850">
                <h5 className="font-bold text-neutral-800 dark:text-white">Guest Protections</h5>
                <p className="text-neutral-450 mt-1 text-[11px]">Includes booking safety checks and alternative stays if a host needs to cancel last minute.</p>
              </div>
              <div className="p-3 border rounded-xl dark:border-neutral-850">
                <h5 className="font-bold text-neutral-800 dark:text-white">Host Protections</h5>
                <p className="text-neutral-450 mt-1 text-[11px]">Covers up to INR 80,00,000 in property damage verification protection and liability checks.</p>
              </div>
            </div>
          </div>
        );
      case 'Anti-discrimination':
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Heart className="h-4 w-4 text-brand" />
              <span>Anti-discrimination Commitment</span>
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We are committed to building an inclusive neighborhood. StayEase enforces strict anti-discrimination guidelines. We welcome guests and hosts of all backgrounds, genders, ethnicities, and identity orientations.
            </p>
          </div>
        );
      case 'Disability support':
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand" />
              <span>Accessibility & Disability Support</span>
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Our engineering supports accessible features such as wheelchair access mappings, step-free pathways, screen reader integrations, and other assistance options to make travel comfortable for everyone.
            </p>
          </div>
        );
      case 'Cancellation options':
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-brand" />
              <span>Cancellation Policies</span>
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Cancel options are set dynamically per listing. StayEase supports free cancellations within 24 hours of booking for flexible listings. Check individual property listing descriptions for full refund terms.
            </p>
          </div>
        );
      case 'StayEase your home':
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Hosting Estimator</h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Did you know you could earn an average of **INR 45,000 monthly** by renting out a spare bedroom in your home? Register as a host, publish listings, and start earning today.
            </p>
            <div className="p-3 bg-brand/5 text-brand rounded-xl font-bold text-center">
              Average Host Earns: INR 1,500/night
            </div>
          </div>
        );
      case 'New features':
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Summer Release Features</h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Discover the latest StayEase updates:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-500 dark:text-neutral-400 pl-1">
              <li>Silky Apple-style micro-animations</li>
              <li>Dual Email & SMS verification checks</li>
              <li>Google Direct Log In integration</li>
              <li>Interactive AI Concierge chatbot</li>
            </ul>
          </div>
        );
      case 'Terms of Service':
      case 'Privacy Policy':
      case 'Sitemap':
      case 'Privacy Choices':
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">StayEase Legal & Policy Agreements</h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              By using our service, you agree to our Terms of Service and Privacy Policy. All user account details are processed securely and comply with global privacy rules.
            </p>
            <p className="text-neutral-450 text-[10px]">Last updated: June 2026</p>
          </div>
        );
      default:
        return (
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{activeOption}</h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Detailed descriptions and guides for {activeOption} are being dynamically prepared. For immediate assistance, please check our main Help Center.
            </p>
          </div>
        );
    }
  };

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 px-6 py-10 transition-colors duration-200 dark:border-neutral-800 dark:bg-neutral-950 md:px-12 relative">
      <div className="mx-auto max-w-7xl">
        
        {/* Apple-style Link Details Overlay Modal */}
        {activeOption && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm cursor-pointer animate-fade-in"
            onClick={() => setActiveOption(null)}
          >
            <div 
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 cursor-default space-y-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-4 dark:border-neutral-750">
                <h3 className="text-base font-black text-neutral-950 dark:text-white">{activeOption}</h3>
                <button
                  onClick={() => setActiveOption(null)}
                  className="rounded-xl p-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-750 dark:text-neutral-400 dark:hover:text-white transition"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                {renderOptionContent()}
              </div>

              {/* Cancel Button */}
              <div className="flex justify-end pt-2 border-t dark:border-neutral-750">
                <button
                  onClick={() => setActiveOption(null)}
                  className="rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold px-5 py-2 text-xs hover:opacity-90 active:scale-95 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 border-b border-neutral-200 pb-8 dark:border-neutral-800 md:grid-cols-4">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Support</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Help Center')} className="hover:underline">Help Center</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'AirCover')} className="hover:underline">AirCover</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Anti-discrimination')} className="hover:underline">Anti-discrimination</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Disability support')} className="hover:underline">Disability support</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Cancellation options')} className="hover:underline">Cancellation options</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Hosting</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'StayEase your home')} className="hover:underline">StayEase your home</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'AirCover for Hosts')} className="hover:underline">AirCover for Hosts</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Hosting resources')} className="hover:underline">Hosting resources</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Community forum')} className="hover:underline">Community forum</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Hosting responsibly')} className="hover:underline">Hosting responsibly</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">StayEase</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Newsroom')} className="hover:underline">Newsroom</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'New features')} className="hover:underline">New features</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Careers')} className="hover:underline">Careers</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Investors')} className="hover:underline">Investors</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Gift cards')} className="hover:underline">Gift cards</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Legal</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Terms of Service')} className="hover:underline">Terms of Service</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Privacy Policy')} className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Sitemap')} className="hover:underline">Sitemap</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Privacy Choices')} className="hover:underline">Privacy Choices</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-sm text-neutral-600 dark:text-neutral-400 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>© 2026 StayEase, Inc.</span>
            <span>·</span>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Terms of Service')} className="hover:underline">Terms</a>
            <span>·</span>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Sitemap')} className="hover:underline">Sitemap</a>
            <span>·</span>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Privacy Policy')} className="hover:underline">Privacy</a>
          </div>

          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 hover:underline">
              <Globe className="h-4 w-4" />
              <span>English (US)</span>
            </button>
            <button className="flex items-center gap-1 hover:underline">
              <DollarSign className="h-4 w-4" />
              <span>INR</span>
            </button>
            <div className="flex gap-4">
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
