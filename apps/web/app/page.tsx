import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-lg py-sm max-w-container-max mx-auto h-20">
          <div className="flex items-center gap-xl">
            <Link className="text-headline-md font-bold text-primary" href="/">
              GroupMarket
            </Link>
            <nav className="hidden md:flex items-center gap-lg">
              <Link className="text-primary font-label-md hover:text-secondary transition-colors" href="/marketplace">
                Browse Feed
              </Link>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="#">
                How it Works
              </a>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="/dashboard">
                Admin Panel
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-md">
            <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-all">
              notifications
            </button>
            <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-all">
              favorite
            </button>
            <div className="h-8 w-px bg-outline-variant/30 mx-xs"></div>
            <Link href="/login" className="px-lg py-2.5 rounded-lg font-label-md text-primary hover:bg-surface-container-low transition-all">
              Login
            </Link>
            <Link href="/register" className="bg-primary text-on-primary px-lg py-2.5 rounded-lg font-label-md shadow-sm hover:scale-[0.98] transition-all">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-xxl pb-xxl overflow-hidden bg-background">
          <div className="max-w-container-max mx-auto px-lg grid lg:grid-cols-2 gap-xl items-center">
            <div className="z-10">
              <span className="inline-block px-md py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold mb-md">
                New: Automatic AI Importing
              </span>
              <h1 className="text-display-lg font-display-lg text-primary mb-lg max-w-xl">
                Turn Facebook Group Posts into a <span className="text-secondary">Premium Marketplace</span>
              </h1>
              <p className="text-body-md text-on-surface-variant mb-xl max-w-lg text-lg">
                Transform chaotic social media selling into a structured, searchable, and professional storefront. Automatically import listings while keeping total control.
              </p>
              <div className="flex flex-wrap gap-md">
                <Link href="/register" className="bg-secondary text-on-secondary px-xl py-lg rounded-xl font-headline-sm shadow-lg hover:shadow-xl hover:scale-[0.98] transition-all flex items-center justify-center gap-sm">
                  Get Started
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link href="/marketplace" className="px-xl py-lg border border-outline rounded-xl font-headline-sm text-primary hover:bg-surface-container-low transition-all flex items-center justify-center">
                  View Demo
                </Link>
              </div>
              <div className="mt-xl flex items-center gap-sm">
                <div className="flex -space-x-2">
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5ftX7rLox__moXd-rOEc15_8YuzjRoPN9SrHhna95fjpaZOGuKzw0Cdc772oXC7rogXo4IrpL9A_R9DVw4uvGpELyAmYfZoyyb8JPT-aEmiMBf0Q0miB058-UQ0qE7RXNB5_r629gyP17y2l05Cdz9nfsQ_xJmYWLDx5zUkL5Uq8pcSWONpo4b9XM3lzSmPE_dnBat8YEqAjaPCVueluqlf7W5AeUWuFf_fKpp2Rjng07ubuYJjhdDwyYQrYMUhrEDlZXP2lHyLU"
                    alt="User"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNU2zsLu5YHImHB5NJ76pGf1fDu3L8NmVa3YBaDzB5WqyBAD24C1eYGXbci5l1kJm_yu7-DJZZ5A0OQycFz-ThnyEgAz0pjLizhHy2DXKTbmMG4IkK76b7bgWmH_P6UnzhUiWh1FFdTYCoJIl0HShLVJpD0IZ6KbYaOsczD5nLfQjMbZBQOxnoS2GyzVgyCP5C9QkSwbKO9A1WGz156fcI-QPjSj9J0Ta3ThsMvMHa7_-PGwzFqa1Tkh1FfnUwZPyUGvlS0xGD_EM"
                    alt="User"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCky65DdnLrnvPfbhtNYBIHgnFmzmSLldH8rM2xqCbyI4tTKf7wkaAxyLs7kH3cCbC9a-blJIuT9bV5aOUTI-sOauIcuXzeSYG0u5u4ORwHPjqFQxDmCeR73x5aQzSgytxYSYwKg8J99TfUUgcnE82j9GdOholAJr21ai-8HAZWTe26KlGBLKe37XKemnxk3fpBz5rldSi06HxJlXE0_n3KFBdgZEAsEJKZxg1Z1vsJICHnDZnh7J8yKewyJ9Dp7pN1hHH080nu55Y"
                    alt="User"
                  />
                </div>
                <p className="text-label-md text-on-surface-variant">Joined by 2,400+ Group Admins</p>
              </div>
            </div>

            {/* Visual Mockup (Bento Style) */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 rounded-[48px] blur-3xl -rotate-6 scale-95"></div>
              <div className="relative w-full grid grid-cols-6 grid-rows-6 gap-sm max-w-xl">
                {/* Messy FB Post */}
                <div className="col-span-3 row-span-3 glass-card p-md rounded-xl rotate-[-4deg] shadow-lg animate-float">
                  <div className="flex items-center gap-sm mb-sm">
                    <div className="w-8 h-8 bg-surface-container-highest rounded-full"></div>
                    <div className="space-y-1">
                      <div className="w-16 h-2 bg-surface-container-highest rounded"></div>
                      <div className="w-12 h-2 bg-surface-container-highest rounded opacity-50"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-md">
                    <div className="w-full h-2 bg-surface-container-highest rounded"></div>
                    <div className="w-4/5 h-2 bg-surface-container-highest rounded"></div>
                  </div>
                  <img
                    className="w-full h-24 object-cover rounded-lg"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWAUtSnQk5KPFrBoMxJ4kO0orkzduYVwbJrXUofc5LMjDF5iBLoeae_ckDQwc-reMqkAD5GGjxNb_5W5DOCi_kncuIVBPLEAXYRpx26PxG96BfHwY2jGPpvWljh_3a-7ct5pSFOWtppZrKqJ80-FD-SGP1wzVh68cO0HLpbdY2ghD_ZR5remSLgJeFPZU50jbNbKJtpiyRGz0FxxjDrXgoSPKR2rdMXClC-ayKbsJzwMlpnF7wR0Bp48a0sXoZSU8K6BTPi4yjnXw"
                    alt="Unstructured listing"
                  />
                </div>
                {/* Organized Card */}
                <div className="col-start-3 col-span-4 row-start-3 row-span-4 bg-white p-lg rounded-2xl shadow-2xl border border-outline-variant/30 z-20">
                  <div className="flex justify-between items-start mb-md">
                    <span className="bg-secondary/10 text-secondary px-sm py-1 rounded text-label-sm font-semibold">Approved</span>
                    <span className="text-headline-sm text-primary font-bold">$240.00</span>
                  </div>
                  <img
                    className="w-full h-48 object-cover rounded-xl mb-md"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4zAuem5qHlpdIoXbw8BafnR7enrB1yqVmogmJMv41GQKCqU-DnUILDthuGbWEJzR_CRFgaZFMccpkOHU_xadzq9UfAN_L-avtqgck0vyiSOge2N0MmKvNl96YH9UY5Durts8a9vEwZ3B_c-6FeomeR7jBWNKeaKGsTq1fmlcOFkFXveTeblY5l8ZDhOJYeneyL4h1lLq6ZHlOudFJ48gjDyYxJZwsuu8NFk-dlKPOq1Q1rbpx2FczWPQZS5HVe8TuawiqstP6JQE"
                    alt="Structured Leica camera"
                  />
                  <h3 className="font-bold text-headline-sm text-primary mb-1">Vintage Leica M3</h3>
                  <div className="flex items-center gap-xs text-on-surface-variant text-label-md mb-md">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    San Francisco, CA
                  </div>
                  <Link href="/marketplace" className="w-full block text-center py-md bg-primary text-on-primary rounded-lg font-bold hover:bg-slate-800 transition-colors">
                    Contact Seller
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-xxl bg-white">
          <div className="max-w-container-max mx-auto px-lg text-center mb-xl">
            <h2 className="text-headline-lg font-headline-lg text-primary mb-md">Engineered for Communities</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto text-lg">
              Stop managing sales in comment threads. Our tools turn your group into a professional ecosystem.
            </p>
          </div>
          <div className="max-w-container-max mx-auto px-lg grid md:grid-cols-3 gap-lg">
            {/* Feature 1 */}
            <div className="p-xl bg-surface-container-low rounded-3xl border border-outline-variant/30 group hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-xl shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">sync</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-primary mb-sm">Auto-Import</h3>
              <p className="text-body-md text-on-surface-variant">
                Our AI monitors your group 24/7. When a member posts an item, it's instantly drafted into your marketplace with categorized specs and clean images.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-xl bg-surface-container-low rounded-3xl border border-outline-variant/30 group hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-xl shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-secondary text-[32px]">verified_user</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-primary mb-sm">Admin Approval Queue</h3>
              <p className="text-body-md text-on-surface-variant">
                Maintain the highest quality. Every imported listing hits your queue first. Approve, edit, or reject with a single click before it goes live.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-xl bg-surface-container-low rounded-3xl border border-outline-variant/30 group hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-xl shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">stay_current_portrait</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-primary mb-sm">Mobile-Ready Feed</h3>
              <p className="text-body-md text-on-surface-variant">
                A silky-smooth mobile experience for your members. Lightning fast loading, intuitive filters, and instant messaging built for the modern phone.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof / Marketplace Preview */}
        <section className="py-xxl bg-background">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="flex flex-col md:flex-row justify-between items-end gap-lg mb-xl">
              <div className="text-left">
                <h2 className="text-headline-lg font-headline-lg text-primary mb-sm">Trusted Marketplace Network</h2>
                <p className="text-body-md text-on-surface-variant">Browsing 14,000+ verified listings across our partner groups.</p>
              </div>
              <div className="flex gap-sm">
                <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-white transition-all">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-white transition-all">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
              {/* Sample Card 1 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-lg transition-all">
                <div className="relative">
                  <img
                    className="w-full h-48 object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDleIWVgxIb5JCUo-frLeGWvPUj25WtLt29nAqh0SXn-jlKXClZf3pDi6pATTM2X2XYTaU90Oh-nlswZYl6u3U9jBVwpb1_ZAhIG9qO-sK4VUzFjxK1yjWzrela8sSXbzj1M3Rr5mrspEi-pMdG-FBejp9FCs1ZSQe5cRsDYP65Dz6XtvZxktsJa0KESN6jybE7fz0Tovq7ZoiwKZoj73S4aLaFNG7DLryoHpb_REXhzwGQHYI_dVlKH6V_PDTvTIDA6hNIWGotKqc"
                    alt="Mechanical Keyboard"
                  />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-sm py-1 rounded-lg text-label-sm font-bold">$120</span>
                </div>
                <div className="p-lg">
                  <h4 className="font-bold text-primary mb-xs">Keychron Q1 Mechanical</h4>
                  <p className="text-label-sm text-on-surface-variant mb-md">Mechanical Keyboard Enthusiasts Group</p>
                  <div className="flex items-center gap-sm">
                    <div className="w-6 h-6 rounded-full bg-secondary-fixed"></div>
                    <span className="text-label-sm text-on-surface">Alex Rivera</span>
                  </div>
                </div>
              </div>
              {/* Sample Card 2 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-lg transition-all">
                <div className="relative">
                  <img
                    className="w-full h-48 object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9QxxRcbsv_4pt41rc3BcNdpuf9igzcPcXIIHaIrfVzMjV1EYyejgWdV7r_K1RaebUElf97JNktKKlAg24AdoXnFdwoW5G6NgO7gn3eC0zbdNNB0rx7BiZJ0dopsa3wIFRtrwSz47SMnRB_gGXL297RHoEsiJ5a7F2Coq4OTKs-hOLOpltAyJ31BZAZKAQV-4NU7rfCq71cVedJDKej_t7SZtJMNMji3C47rAgEsfq1S7CRgMXbSTPJKb8WNG4ChzjP7wN9t1Z5KQ"
                    alt="Retro Sneakers"
                  />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-sm py-1 rounded-lg text-label-sm font-bold">$450</span>
                </div>
                <div className="p-lg">
                  <h4 className="font-bold text-primary mb-xs">Air Jordan 1 Retro Low</h4>
                  <p className="text-label-sm text-on-surface-variant mb-md">Hypebeast Marketplace SF</p>
                  <div className="flex items-center gap-sm">
                    <div className="w-6 h-6 rounded-full bg-primary-fixed"></div>
                    <span className="text-label-sm text-on-surface">Jordan S.</span>
                  </div>
                </div>
              </div>
              {/* Sample Card 3 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-lg transition-all">
                <div className="relative">
                  <img
                    className="w-full h-48 object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEWwc3OVF-hMVwafyIgdFaxQQUpaL6SkcSGUZrSlFRMIX5vp7XFUvP2ZOQswT06xxHYfl91_jSKSfCbK1SY1jcy5e0P9-i_d7Hg2fOKjKAYhdcNiFMl_5OZxZBPV4dI49d6ZLDiSvstkZ8iodA1koP3_Kkf4qOFEDYXlQJxj-830G4kUWiGrfbY-EkjmCCbpbk0VGeUUSBqNoDqcC_FAO7c4tzeb4VqbT2L2II4vfaJkQH0J-kSnxTWCFOvRzKmx1Etps88oeXeRE"
                    alt="Aeron Chair"
                  />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-sm py-1 rounded-lg text-label-sm font-bold">$890</span>
                </div>
                <div className="p-lg">
                  <h4 className="font-bold text-primary mb-xs">Herman Miller Aeron B</h4>
                  <p className="text-label-sm text-on-surface-variant mb-md">Office Liquidation Bay Area</p>
                  <div className="flex items-center gap-sm">
                    <div className="w-6 h-6 rounded-full bg-secondary-fixed-dim"></div>
                    <span className="text-label-sm text-on-surface">Sarah Chen</span>
                  </div>
                </div>
              </div>
              {/* Sample Card 4 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-lg transition-all">
                <div className="relative">
                  <img
                    className="w-full h-48 object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8OGLgNIeADhCTzMmSmc4dR6cTd9k1XjqJhHnh5CUS0oznrGtbT3pKW6eO7zh3UokWIR3SI3XNn4Icx-y7pUbg52e-2PcKiFLRpPgGUVHzH71ELupr52SyJPYLZ6UzS82pyMXkgcFbAAL3biy90gYH0khcBXbv9ocanGkficAlnF6TuIxbie7I4JeWaijMHQv-_HSxA7liGdb_h7fwhkiv1OaEjQDqNKdFtxoCyyC-jzPkhOzt9u5Dib6Pcrajk8LXT3XFx5gx9Oc"
                    alt="Espresso Machine"
                  />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-sm py-1 rounded-lg text-label-sm font-bold">$1,200</span>
                </div>
                <div className="p-lg">
                  <h4 className="font-bold text-primary mb-xs">Rocket Appartamento</h4>
                  <p className="text-label-sm text-on-surface-variant mb-md">Espresso Aficionados Market</p>
                  <div className="flex items-center gap-sm">
                    <div className="w-6 h-6 rounded-full bg-on-tertiary-container"></div>
                    <span className="text-label-sm text-on-surface">Marcus T.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-xxl bg-white">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="bg-primary rounded-[40px] p-xl md:p-xxl relative overflow-hidden text-center md:text-left">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/10 blur-[100px] rounded-full"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-xl">
                <div className="max-w-xl">
                  <h2 className="text-display-lg font-display-lg text-on-primary mb-md">Ready to upgrade your group?</h2>
                  <p className="text-body-lg text-on-primary-container text-slate-300 text-lg">
                    Join thousands of admins who have professionalized their community commerce in under 5 minutes.
                  </p>
                </div>
                <Link href="/register" className="bg-secondary-container text-on-secondary-container px-xl py-lg rounded-2xl font-headline-sm hover:scale-105 transition-all whitespace-nowrap">
                  Sync Your Group Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-on-primary-container pt-xxl pb-xl border-t border-primary-container">
        <div className="max-w-container-max mx-auto px-lg grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-xl mb-xxl text-slate-300">
          <div className="col-span-2">
            <Link className="text-headline-md font-bold text-on-primary mb-lg inline-block text-white" href="/">
              GroupMarket
            </Link>
            <p className="text-body-sm text-on-primary-container max-w-xs mb-lg text-slate-400">
              The bridge between social communities and professional commerce. We help you scale trust.
            </p>
            <div className="flex gap-md">
              <a className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center hover:bg-secondary/20 transition-all text-white" href="#">
                <span className="material-symbols-outlined text-[20px]">public</span>
              </a>
              <a className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center hover:bg-secondary/20 transition-all text-white" href="#">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>
            </div>
          </div>
          <div>
            <h5 class="text-on-primary font-bold mb-lg text-white">Platform</h5>
            <ul className="space-y-md text-label-md text-slate-400">
              <li><Link className="hover:text-on-primary transition-all" href="/marketplace">Browse</Link></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Sync Tech</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Mobile App</a></li>
            </ul>
          </div>
          <div>
            <h5 class="text-on-primary font-bold mb-lg text-white">Resources</h5>
            <ul className="space-y-md text-label-md text-slate-400">
              <li><a className="hover:text-on-primary transition-all" href="#">How it Works</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Admin Guide</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Success Stories</a></li>
            </ul>
          </div>
          <div>
            <h5 class="text-on-primary font-bold mb-lg text-white">Company</h5>
            <ul className="space-y-md text-label-md text-slate-400">
              <li><a className="hover:text-on-primary transition-all" href="#">About Us</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Careers</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 class="text-on-primary font-bold mb-lg text-white">Legal</h5>
            <ul className="space-y-md text-label-md text-slate-400">
              <li><a className="hover:text-on-primary transition-all" href="#">Privacy</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Terms</a></li>
              <li><a className="hover:text-on-primary transition-all" href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-lg pt-xl border-t border-primary-container flex flex-col md:flex-row justify-between items-center gap-md text-slate-500 text-sm">
          <p className="text-label-sm opacity-50">© 2026 GroupMarket Inc. All rights reserved.</p>
          <div className="flex items-center gap-lg">
            <span className="flex items-center gap-xs text-label-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
