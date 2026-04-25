import React, { useState, useEffect } from "react";

const Lyrics = () => {
  const [songbooks, setSongbooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadSongbooks = async () => {
      const files = [
        "first_sunday.json",
        "second_sunday.json",
        "third_sunday.json"
      ];
      const loadedBooks = await Promise.all(
        files.map(async (file) => {
          const data = await import(`../songbooks/${file}`);
          return data.default;
        })
      );
      setSongbooks(loadedBooks);
    };

    loadSongbooks();
  }, []);

  const handleSearch = () => {
    const found = [];
    songbooks.forEach((book) => {
      book.Songs.forEach((song) => {
        song.Verses.forEach((verse) => {
          if (verse.Text && verse.Text.toLowerCase().includes(searchTerm.toLowerCase())) {
            found.push({ song: song.Text, verse: verse.Text });
          }
        });
      });
    });
    setResults(found);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Lyrics</h2>
      <input
        type="text"
        placeholder="Search lyrics..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <div style={{ marginTop: "1rem" }}>
        {results.map((r, idx) => (
          <div key={idx}>
            <h4>{r.song}</h4>
            <p>{r.verse}</p>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lyrics;