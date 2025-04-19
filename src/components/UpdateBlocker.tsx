export default function UpdateBlocker() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-center px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">
        We’re currently updating our website
      </h1>
      <p className="text-lg mb-6">
        The new page will be live <strong>after 11:00 AM on April 20</strong>.
      </p>

      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">
          We are <span className="text-purple-600">New Seoul Church</span>
        </h2>
        <p className="text-base text-gray-700">
          A gospel-centered English-speaking church in the heart of Seoul.
          <br />
          Join us in person every Sunday at <strong>11:00 AM</strong>.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          2221 Nambusunhwan-ro, Seocho-gu, Seoul
        </p>
      </div>

      <div className="flex gap-4">
        <a
          href="https://www.youtube.com/@newseoulchurch"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-4 border border-black rounded-md text-sm font-medium hover:bg-black hover:text-white transition"
        >
          YouTube
        </a>
        <a
          href="https://www.instagram.com/nsc_newseoulchurch/"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-4 border border-black rounded-md text-sm font-medium hover:bg-black hover:text-white transition"
        >
          Instagram
        </a>
      </div>

      <p className="mt-10 text-sm text-gray-400">
        Thank you for your patience!
      </p>
    </main>
  );
}
