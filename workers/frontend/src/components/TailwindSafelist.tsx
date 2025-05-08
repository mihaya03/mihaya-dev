// Tailwind Safelist - components.tsxで使用されているクラスを含める
const TailwindSafelist = () => (
  <div className="hidden 
    text-2xl font-bold mb-4 !bg-red-500
    bg-gray-100 dark:bg-gray-700 text-red-500 dark:text-red-400 px-1 py-0.5 rounded-sm text-sm
    !bg-gray-100 dark:!bg-gray-800 p-4 rounded-md overflow-x-auto
    !bg-transparent
  ">
    {/* components.tsxで使用している全クラスをここに含める */}
  </div>
);

export default TailwindSafelist;