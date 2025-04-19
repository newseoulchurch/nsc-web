const cards = [
  {
    title: "REVISITING GOD CENTERED WORSHIP",
    body: "He must increase, we must decrease",
    verse: "John 3:30",
  },
  {
    title: "RAISING TRUE DISCIPLES OF CHRIST",
    body: "Making essential the radical call to follow Christ",
    verse: "Matthew 4:19-20",
  },
  {
    title: "HOLDING TRUTH, TESTING TRADITION",
    body: "Holding firm to the principles of the Timeless Word, yet pressing forward to new forms of ministry",
  },
  {
    title: "HEART OVER APPEARANCE",
    body: "In a culture of Appearance, we want to deeply value the Heart.",
    verse: "1 Samuel 16:7",
  },
  {
    title: "REVIVING OUR JESUS WITNESS",
    body: "Pouring into the New wineskin of church",
    verse: "Philippians 2:15",
  },
  {
    title: "PEACEMAKING FOR THE UNIVERSAL CHURCH",
    body: "Not a church of singular language, but a church for all nations.",
    verse: "1 Corinthians 1:10",
  },
];

export default function VisionCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 py-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-[12px] shadow-md">
          <h3 className="text-[20px] font-bold uppercase text-black mb-2">
            {card.title}
          </h3>
          <p className="uppercase text-gray-700 leading-snug">
            {card.body}
            {card.verse && (
              <span className="block mt-2">({card.verse.toUpperCase()})</span>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}
