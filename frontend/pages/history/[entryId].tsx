// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import Head from 'next/head';
// import { ArrowLeft, Play, Eye, Clock, FileText, Box, Trash2, Menu } from 'lucide-react';
// import { getModelEntry, deleteModelEntry, ModelEntry } from '../../lib/api';
// import { getImageUrl } from '../../lib/utils';
// import ThreeJSViewer from '../../components/ThreeJSViewer';
// import Sidebar from '../../components/Sidebar';

// export default function HistoryPage() {
//   const router = useRouter();
//   const { entryId } = router.query;
//   const [entry, setEntry] = useState<ModelEntry | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [show3DModel, setShow3DModel] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     if (entryId) {
//       loadEntry();
//     }
//   }, [entryId]);

//   const loadEntry = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const data = await getModelEntry(entryId as string);
//       setEntry(data);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to load entry');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     router.push('/');
//   };

//   const handleDelete = async () => {
//     if (!entry) return;
    
//     if (!confirm('Are you sure you want to delete this generation?')) {
//       return;
//     }

//     try {
//       await deleteModelEntry(entry.id);
//       router.push('/');
//     } catch (error) {
//       alert(error instanceof Error ? error.message : 'Failed to delete entry');
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
//         <div className="text-center text-white space-y-6">
//           <div className="relative">
//             <div className="w-20 h-20 mx-auto">
//               <div className="absolute inset-0 border-4 border-purple-200 border-opacity-20 rounded-full"></div>
//               <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
//                   <Eye size={20} />
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div>
//             <h2 className="text-2xl font-bold mb-2">Loading generation...</h2>
//             <p className="text-gray-300">Retrieving your saved data</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
//         <div className="text-center text-white space-y-6 max-w-md mx-auto px-4">
//           <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
//             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <div>
//             <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
//             <p className="text-red-300 mb-6">{error}</p>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button 
//               onClick={loadEntry}
//               className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
//             >
//               <Eye size={18} />
//               <span className="ml-2">Try Again</span>
//             </button>
//             <button 
//               onClick={handleBack}
//               className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
//             >
//               <ArrowLeft size={18} />
//               <span className="ml-2">Back to Home</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!entry) {
//     return null;
//   }

//   // Create a mapping of timestamps to their corresponding images
//   const timestampImageMap = entry.timestamps.map((timestamp, index) => ({
//     timestamp,
//     imageUrl: entry.image_urls && entry.image_urls[index] ? entry.image_urls[index] : null
//   }));

//   return (
//     <>
//       <Head>
//         <title>Generation History - ThirteenLabs</title>
//         <meta name="description" content="View your saved generation from ThirteenLabs" />
//       </Head>

//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
//         {/* Sidebar */}
//         <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
//         {/* Main Content */}
//         <div className="flex-1 lg:ml-80">
//           {/* Header */}
//           <div className="absolute top-6 left-6 z-20 flex items-center space-x-4">
//             <button
//               onClick={() => setSidebarOpen(true)}
//               className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
//             >
//               <Menu size={24} />
//             </button>
//             <button 
//               onClick={handleBack}
//               className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-opacity-70 transition-all duration-300 flex items-center border border-white border-opacity-20"
//             >
//               <ArrowLeft size={18} />
//               <span className="ml-2">Back to ThirteenLabs</span>
//             </button>
            
//             <button 
//               onClick={handleDelete}
//               className="bg-red-600 bg-opacity-50 backdrop-blur-sm text-white px-4 py-3 rounded-xl hover:bg-opacity-70 transition-all duration-300 flex items-center border border-red-400 border-opacity-20"
//               title="Delete this generation"
//             >
//               <Trash2 size={18} />
//             </button>
//           </div>

//           {/* Main Content */}
//           <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
//             <div className="text-center mb-12">
//               <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
//                 Saved Generation
//               </h1>
//               <p className="text-xl text-gray-300">
//                 Created on {formatDate(entry.created_at)}
//               </p>
//             </div>

//             <div className="grid lg:grid-cols-2 gap-8">
//               {/* Object Description */}
//               <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
//                 <div className="flex items-center mb-6">
//                   <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
//                     <FileText size={24} />
//                   </div>
//                   <h2 className="text-2xl font-bold text-white">Object Description</h2>
//                 </div>
//                 <p className="text-gray-200 leading-relaxed text-lg">
//                   {entry.description}
//                 </p>
//               </div>

//               {/* Timestamps Summary */}
//               <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
//                 <div className="flex items-center mb-6">
//                   <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
//                     <Clock size={24} />
//                   </div>
//                   <h2 className="text-2xl font-bold text-white">Key Moments</h2>
//                 </div>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <span className="text-gray-300">Total timestamps found:</span>
//                     <span className="text-white font-semibold">{entry.timestamps.length}</span>
//                   </div>
//                   {entry.timestamps.map((timestamp, index) => (
//                     <div key={index} className="flex justify-between items-center">
//                       <span className="text-gray-300">View {index + 1}:</span>
//                       <span className="text-white font-semibold">{timestamp}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Orthographic Views */}
//             <div className="mt-8 bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
//               <h2 className="text-2xl font-bold text-white mb-6">Orthographic Views</h2>
//               <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 {timestampImageMap.map((item, index) => (
//                   <div key={index} className="space-y-3">
//                     <h3 className="text-lg font-semibold text-purple-300">View {index + 1}</h3>
//                     <div className="space-y-2">
//                       <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
//                         <div className="text-white font-mono text-sm mb-2">{item.timestamp}</div>
//                         {item.imageUrl ? (
//                           <img 
//                             src={getImageUrl(item.imageUrl)}
//                             alt={`View ${index + 1} at ${item.timestamp}`}
//                             className="w-full h-32 object-cover rounded-lg"
//                             onError={(e) => {
//                               // Fallback if image fails to load
//                               e.currentTarget.style.display = 'none';
//                               e.currentTarget.nextElementSibling.style.display = 'flex';
//                             }}
//                           />
//                         ) : (
//                           <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
//                             <span className="text-gray-400 text-sm">No image available</span>
//                           </div>
//                         )}
//                         <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center hidden">
//                           <span className="text-gray-400 text-sm">Image not available</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* 3D Model Section */}
//             {entry.threejs_code && (
//               <div className="mt-8 bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center">
//                     <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
//                       <Box size={24} />
//                     </div>
//                     <h2 className="text-2xl font-bold text-white">3D Model</h2>
//                   </div>
//                   <button
//                     onClick={() => setShow3DModel(!show3DModel)}
//                     className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
//                   >
//                     <Play size={18} />
//                     <span className="ml-2">{show3DModel ? 'Hide' : 'View'} 3D Model</span>
//                   </button>
//                 </div>
                
//                 {show3DModel && (
//                   <div className="mt-6">
//                     <ThreeJSViewer threejsCode={entry.threejs_code} />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Branding */}
//           <div className="fixed bottom-6 right-6 z-20">
//             <div className="bg-black bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white border-opacity-10">
//               <p className="text-sm text-gray-300">
//                 Powered by <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">ThirteenLabs</span>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// } 