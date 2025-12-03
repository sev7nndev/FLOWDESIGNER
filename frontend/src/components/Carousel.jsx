// frontend/src/components/Carousel.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Loader2 } from 'lucide-react';

const Carousel = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const urls = await apiService.getCarouselImages();
                setImages(urls);
            } catch (e) {
                // Usar imagens de fallback se a API falhar
                setImages([
                    'https://via.placeholder.com/300x400?text=Design+1',
                    'https://via.placeholder.com/300x400?text=Design+2',
                    'https://via.placeholder.com/300x400?text=Design+3',
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-16">
                <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
            </div>
        );
    }

    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-800">Designs Gerados pela IA</h2>
                <p className="text-gray-500">Veja o que você pode criar em segundos.</p>
            </div>
            <div className="flex space-x-6 overflow-x-scroll p-4 no-scrollbar">
                {images.map((url, index) => (
                    <div key={index} className="flex-shrink-0 w-64 h-80 rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition duration-300">
                        <img 
                            src={url} 
                            alt={`Design ${index + 1}`} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Carousel;