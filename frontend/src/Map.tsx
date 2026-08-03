import React, {useState, useEffect, useMemo} from 'react';
import {io} from 'socket.io-client';
import {TransformWrapper, TransformComponent} from "react-zoom-pan-pinch";
import {Region, Team} from '../../shared/types';
import {vancouverMapData} from './map-data';
import {SERVER_URL} from './config';

const API_BASE_URL = `${SERVER_URL}/api`;

export default function Map() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on('gameStateUpdate', (data) => {
      setRegions(data.regions);
      setSelectedRegion(currentSelected => {
        if (!currentSelected) return null;
        return data.regions.find((r: Region) => r.id === currentSelected.id) || null;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const redScore = useMemo(() => {
    return regions.filter(r => r.team === 'RED').length;
  }, [regions]);
  const blueScore = useMemo(() => {
    return regions.filter(r => r.team === 'BLUE').length;
  }, [regions]);

  const updateRegion = (url: string) => {
    if (selectedRegion) {
      fetch(`${API_BASE_URL}/regions/${selectedRegion.id}/${url}`, {
        method: 'POST',
      });
      setSelectedRegion(null);
    }
  };

  const handleClaim = (event: React.MouseEvent<SVGElement>) => {
    const target = event.target as SVGElement;
    if (target.id && target.id !== 'vancouver-neighborhoods') {
      const clickedRegion = regions.find(r => r.id === target.id);
      if (clickedRegion) {
        setSelectedRegion(clickedRegion);
      }
    }
  };

  const handleTeamSelect = (team: Team) => {
    updateRegion(`claim?team=${team}`);
  };

  const handleLock = (lock: boolean) => {
    updateRegion(`lock?lock=${lock}`);
  };

  const getRegionColor = (id: string) => {
    const region = regions.find(r => r.id === id);
    if (!region || region.team === 'NONE') return 'lightgray';
    if (region.team === 'RED') return 'red';
    if (region.team === 'BLUE') return 'blue';
    return 'lightgray';
  };

  const getRegionOpacity = (id: string) => {
    const region = regions.find(r => r.id === id);
    return region?.locked ? 1.0 : 0.6;
  }

  const zoomButtonStyle = {
    width: '40px', height: '40px', borderRadius: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)',
    border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    fontSize: '20px', fontWeight: 'bold', color: '#475569',
    cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '500px',
      overflow: 'hidden',
      backgroundColor: '#e2e8f0',
      border: '2px solid #a8a8cc',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      boxSizing: 'border-box',
      padding: '60px 20px 20px 20px'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        display: 'flex',
        gap: '15px',
        padding: '10px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '9999px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        zIndex: 10,
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        <span style={{ color: '#dc2626' }}>🔴 {redScore}</span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span style={{ color: '#2563eb' }}>{blueScore} 🔵</span>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.01 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <React.Fragment>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button onClick={() => zoomIn()} style={zoomButtonStyle}>+</button>
              <button onClick={() => zoomOut()} style={zoomButtonStyle}>-</button>
              <button onClick={() => resetTransform()} style={{...zoomButtonStyle, fontSize: '16px'}}>↺</button>
            </div>

            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 800 385"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: '100%', height: '100%' }}
              >
                <g
                  id="vancouver-neighborhoods"
                  fill="lightgray"
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onClick={handleClaim}
                >
                  {vancouverMapData.map((region) => (
                    <path
                      key={region.id}
                      id={region.id}
                      d={region.path}
                      fill={getRegionColor(region.id)}
                      opacity={getRegionOpacity(region.id)}
                      style={{ transition: 'fill 0.2s ease, opacity 0.2s ease' }}
                    />
                  ))}
                </g>

                <g id="locks" style={{ pointerEvents: 'none' }}>
                  {regions.filter(r => r.locked).map(region => {
                    const data = vancouverMapData.find(r => r.id === region.id);
                    if (!data) return null;
                    return (
                      <text
                        key={`lock-${region.id}`}
                        x={data.lockX}
                        y={data.lockY}
                        fontSize="22"
                        textAnchor="middle"
                      >
                        🔒
                      </text>
                    );
                  })}
                </g>
              </svg>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>

      {selectedRegion && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '5%',
          width: '90%',
          padding: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b', lineHeight: '1.2', textAlign: 'left', flex: 1 }}>
                {selectedRegion.name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleLock(!selectedRegion.locked)}
                  style={{
                    margin: 0,
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: selectedRegion.locked ? '#b91c1c' : '#15803d',
                    backgroundColor: selectedRegion.locked ? '#fee2e2' : '#dcfce7',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {selectedRegion.locked ? ' 🔒 ' : ' 🔓 '}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedRegion(null)}
              style={{
                width: '32px', height: '32px', borderRadius: '16px',
                border: 'none', backgroundColor: '#e2e8f0', color: '#475569',
                fontWeight: 'bold', cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '12px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleTeamSelect('RED')}
              disabled={selectedRegion.locked}
              style={{
                flex: 1, padding: '12px', borderRadius: '9999px', border: 'none',
                backgroundColor: selectedRegion.locked ? '#fca5a5' : '#ef4444',
                color: 'white', fontWeight: 'bold', fontSize: '14px',
                cursor: selectedRegion.locked ? 'not-allowed' : 'pointer',
                boxShadow: selectedRegion.locked ? 'none' : '0 4px 0 #b91c1c'
              }}
            >
              Red Claim
            </button>
            <button
              onClick={() => handleTeamSelect('BLUE')}
              disabled={selectedRegion.locked}
              style={{
                flex: 1, padding: '12px', borderRadius: '9999px', border: 'none',
                backgroundColor: selectedRegion.locked ? '#93c5fd' : '#3b82f6',
                color: 'white', fontWeight: 'bold', fontSize: '14px',
                cursor: selectedRegion.locked ? 'not-allowed' : 'pointer',
                boxShadow: selectedRegion.locked ? 'none' : '0 4px 0 #1d4ed8'
              }}
            >
              Blue Claim
            </button>
            <button
              onClick={() => handleTeamSelect('NONE')}
              disabled={selectedRegion.locked}
              style={{
                flex: 1, padding: '12px', borderRadius: '9999px', border: 'none',
                backgroundColor: selectedRegion.locked ? '#e2e8f0' : '#cbd5e1',
                color: '#475569', fontWeight: 'bold', fontSize: '14px',
                cursor: selectedRegion.locked ? 'not-allowed' : 'pointer',
                boxShadow: selectedRegion.locked ? 'none' : '0 4px 0 #94a3b8'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}