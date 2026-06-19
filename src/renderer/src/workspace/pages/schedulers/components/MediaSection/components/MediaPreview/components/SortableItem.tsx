// components/SortableMediaItem.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@renderer/redux/store';

interface SortableMediaItemProps {
  index: number;
  urlsObj: { filePath: string; previewUrl: string; isPaid: boolean };
  isDragging: boolean;
  // setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  onMediaClick: (media: { filePath: string; previewUrl: string; isPaid: boolean }) => void;
  onDelete: (index: number) => void;
  onTogglePremium: (index: number) => void;
  premiumImages: number[];
}

const SortableMediaItem: React.FC<SortableMediaItemProps> = ({
  index,
  urlsObj,
  isDragging,
  onMediaClick,
  onDelete,
  onTogglePremium,
  // setIsDragging,
  premiumImages,
}) => {

  const scheduler = useSelector((state: RootState) => state.currentScheduler)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: urlsObj.filePath });
  
console.log(isDragging)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    
  };

  // console.log('setIsDragging:', setIsDragging); 

    return (
      <div
      ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => onMediaClick(urlsObj)}
              className="border-2 border-gray-500 relative group bg-gray-200 rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300"
              
              >
              </div>
              <img
                src={urlsObj.previewUrl}
                className="w-full h-full object-cover"
                style={{
                  aspectRatio: '1 / 1',
                  filter: premiumImages.includes(index) ? 'blur(4px)' : 'none',// Blur if premium
                  cursor: !isDragging ? 'grab' : 'grabbing', 
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-black text-white text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {urlsObj.filePath.toLowerCase().match(/\.(mp4|avi|webm|ogg)$/) ? 'Video' : 'Image'}
              </div>
              <button
              // onMouseEnter={() => {
              //   console.log('mouse enter in delete');
              //   setIsDragging(true);
              // }}
              onMouseEnter={()=>{
                console.log('mouse enter')
                console.log(isDragging)
              }}
              onClick={(e) => {
                console.log('delete clicked')
                e.stopPropagation(); // Prevents the click event from reaching the parent div
                  onDelete(index);
                }}
                style={{cursor: !isDragging ? 'cursor' : 'cursor'}}
                className="absolute top-1 right-1 text-red-500 text-sm rounded-full opacity-0 group-hover:opacity-100"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
              {
                (scheduler.platform === 'OF Post') &&
                <button
                  onClick={(e) => {

                    e.stopPropagation(); // Prevents the click event from reaching the parent div
                    onTogglePremium(index);
                  }}
                  style={{cursor: !isDragging ? 'cursor' : 'grabbing'}}
                  className="z-[200] absolute top-6 right-1 text-green-500 text-sm rounded-full opacity-0 group-hover:opacity-100"
                >
                  <FontAwesomeIcon icon={faDollarSign} />
                </button>
              }

            </div>
    );
  };

  export default SortableMediaItem;