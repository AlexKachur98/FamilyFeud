/**
 * @file SearchBar.jsx
 * @author Pierre Moreau
 * @since 2025-11-27
 * @purpose Search bar component for filtering content.
*/
export default function SearchBar({ placeholder, data, setData }) {
    return (
        <input 
            className="search-bar"
            type="search" 
            placeholder={placeholder}
            onChange={(e) => {
                const query = e.target.value.toLowerCase();
                const filteredData = data.filter(d => 
                    (d?.text && d.text.toLowerCase().includes(query)) ||
                    (d?.tags && d?.tags.some(tag => tag.toLowerCase().includes(query)))
                );
                setData(filteredData);
            }}
        />
    );
}
