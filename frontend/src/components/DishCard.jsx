import React from 'react';

const DishCard = ({ dish, onToggle }) => {
  const { dishId, dishName, imageUrl, isPublished } = dish;

  return (
    <div className="card">
      <div className="card-img-wrapper">
        <img 
          src={imageUrl} 
          alt={dishName} 
          className="card-img" 
          loading="lazy" 
        />
        <div className={`card-badge ${isPublished ? 'published' : 'unpublished'}`}>
          {isPublished ? 'Published' : 'Hidden'}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{dishName}</h3>
        
        <div className="card-footer">
          <span className="card-id-badge">ID: {dishId}</span>
          
          <div className="toggle-btn">
            <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isPublished} 
                onChange={() => onToggle(dishId)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishCard;
