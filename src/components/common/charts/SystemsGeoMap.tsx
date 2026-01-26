import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HeatPumpIcon from "@mui/icons-material/HeatPump";
import HomeIcon from "@mui/icons-material/Home";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RemoveIcon from "@mui/icons-material/Remove";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import { Card, IconButton, Popover, Tooltip, Typography } from "@mui/material";
// @ts-expect-error - projectionById exists at runtime in @nivo/geo but current types might missing it
import { projectionById, ResponsiveGeoMap } from "@nivo/geo";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import germanStates from "../../../data/germanState.geo.json";
import { getBuildingTypeLabel } from "../../../lib/enumCatalog";
import type { HeatingSystemWithLocation } from "../../../types/database.types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

interface SystemsGeoMapProps {
  systems: HeatingSystemWithLocation[];
  onSystemClick?: (heatingIds: string[]) => void;
}

interface SystemDetails {
  buildingType: string | null;
  buildingYear: number | null;
  energyStandard: string | null;
  heatedArea: number | null;
  modelIdu: string | null;
  modelOdu: string | null;
}

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  heatingIds: string[];
  systemNames: string[];
  postalCodes: string[];
  systemDetails: SystemDetails[];
  count: number;
}

interface GeoMapLayerProps {
  width: number;
  height: number;
}

// Compact info row component
const InfoRow = ({
  icon,
  label,
  value,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}) => (
  <Tooltip title={tooltip || label} placement="left" arrow>
    <div className="geo-map-info-row">
      {icon}
      <span className="geo-map-info-value">{value}</span>
    </div>
  </Tooltip>
);

// Clickable system name link component
const SystemNameLink = ({
  name,
  isSelected,
  onClick,
}: {
  name: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  // biome-ignore lint/a11y/useSemanticElements: Using span for inline text styling, button would break text flow
  <span
    className={`geo-map-system-link ${isSelected ? "geo-map-system-link--selected" : "geo-map-system-link--unselected"}`}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        onClick();
      }
    }}
    role="button"
    tabIndex={0}
  >
    {name}
  </span>
);

/**
 * Markers component to render on top of the map.
 * Receives the projection function and handles markers interaction.
 */
const Markers = ({
  projection,
  mapPoints,
  onSystemClick,
  t,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: complex D3 type
  projection: any;
  mapPoints: MapPoint[];
  onSystemClick?: (ids: string[]) => void;
  t: TFunction;
}) => {
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedSystemIndex, setSelectedSystemIndex] = useState<number>(0);

  const handlePointClick = (event: React.MouseEvent<SVGGElement>, point: MapPoint) => {
    // Prevent event from bubbling if needed, but here we want it to potentially bubble
    onSystemClick?.(point.heatingIds);
    setSelectedPoint(point);
    setSelectedSystemIndex(0); // Reset to first system when opening popover
    // biome-ignore lint/suspicious/noExplicitAny: SVGGElement doesn't directly match HTMLElement for Popover anchor
    setAnchorEl(event.currentTarget as any);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedPoint(null);
    setSelectedSystemIndex(0);
  };

  const handleSystemSelect = (index: number) => {
    setSelectedSystemIndex(index);
  };

  return (
    <>
      <g className="markers">
        {mapPoints.map((point) => {
          const coords = projection([point.longitude, point.latitude]);
          if (!coords) return null;

          const [x, y] = coords;
          const isCluster = point.count > 1;
          const isHovered = hoveredPointId === point.id;
          const radius = isCluster ? (isHovered ? 12 : 10) : isHovered ? 8 : 6;

          return (
            // biome-ignore lint/a11y/useSemanticElements: Cannot use <button> inside SVG context, role="button" is the correct approach for interactive SVG elements
            <g
              key={point.id}
              style={{ cursor: "pointer" }}
              onClick={(e) => handlePointClick(e, point)}
              onMouseEnter={() => setHoveredPointId(point.id)}
              onMouseLeave={() => setHoveredPointId(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSystemClick?.(point.heatingIds);
                  e.preventDefault();
                }
              }}
              aria-label={
                isCluster
                  ? t("systems.systemsAtLocation", { count: point.count })
                  : point.systemNames[0]
              }
            >
              {/* Outer glow for hovered state */}
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius + 4}
                  fill={
                    isCluster ? "var(--primary-color, #2196f3)" : "var(--accent-color, #ff9800)"
                  }
                  opacity={0.3}
                />
              )}

              {/* Main circle */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={isCluster ? "var(--primary-color, #2196f3)" : "var(--accent-color, #ff9800)"}
                stroke="white"
                strokeWidth={2}
                opacity={0.9}
                style={{ transition: "all 0.2s ease-in-out" }}
              />

              {/* Count badge for clusters */}
              {isCluster && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="geo-map-marker-text"
                >
                  {point.count}
                </text>
              )}
            </g>
          );
        })}
      </g>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        PaperProps={{
          className: "geo-map-popover",
        }}
      >
        {selectedPoint &&
          (() => {
            const isMultiple = selectedPoint.count > 1;
            const currentDetails = selectedPoint.systemDetails[selectedSystemIndex];
            const currentPostalCode =
              selectedPoint.postalCodes[selectedSystemIndex] || selectedPoint.postalCodes[0];

            return (
              <div>
                {/* Header */}
                <Typography variant="subtitle2" color="primary" className="geo-map-popover-header">
                  {isMultiple
                    ? t("systems.systemsAtLocation", {
                        count: selectedPoint.count,
                      })
                    : t("systems.systemDetails")}
                </Typography>

                {/* System names section - show as clickable links if multiple, otherwise as plain text */}
                <div className="geo-map-popover-names">
                  {isMultiple ? (
                    // Multiple systems: clickable links
                    <>
                      {selectedPoint.systemNames.slice(0, 8).map((name, idx) => (
                        <SystemNameLink
                          key={`${selectedPoint.id}-${idx}`}
                          name={name}
                          isSelected={idx === selectedSystemIndex}
                          onClick={() => handleSystemSelect(idx)}
                        />
                      ))}
                      {selectedPoint.count > 8 && (
                        <span className="geo-map-popover-more">
                          ...{" "}
                          {t("common.andMore", {
                            count: selectedPoint.count - 8,
                          })}
                        </span>
                      )}
                    </>
                  ) : (
                    // Single system: plain text
                    <span className="geo-map-popover-single-name">
                      {selectedPoint.systemNames[0]}
                    </span>
                  )}
                </div>

                {/* System details section - same for both single and multiple */}
                <div className="geo-map-popover-details">
                  {/* Postal Code */}
                  {currentPostalCode && (
                    <InfoRow
                      icon={<LocationOnIcon />}
                      label={t("tableHeaders.postalCode")}
                      value={currentPostalCode}
                    />
                  )}

                  {/* Building Type */}
                  {currentDetails?.buildingType && (
                    <InfoRow
                      icon={<HomeIcon />}
                      label={t("systemForm.buildingType")}
                      value={getBuildingTypeLabel(t, currentDetails.buildingType)}
                      tooltip={t("systemForm.buildingType")}
                    />
                  )}

                  {/* Construction Year */}
                  {currentDetails?.buildingYear && (
                    <InfoRow
                      icon={<CalendarTodayIcon />}
                      label={t("systemForm.buildingConstructionYear")}
                      value={currentDetails.buildingYear.toString()}
                      tooltip={t("systemForm.buildingConstructionYear")}
                    />
                  )}

                  {/* Heated Area */}
                  {currentDetails?.heatedArea && (
                    <InfoRow
                      icon={<SquareFootIcon />}
                      label={t("tableHeaders.heatedArea")}
                      value={`${currentDetails.heatedArea} m²`}
                      tooltip={t("tableHeaders.heatedArea")}
                    />
                  )}

                  {/* Heat Pump Model (IDU / ODU) */}
                  {(currentDetails?.modelIdu || currentDetails?.modelOdu) && (
                    <InfoRow
                      icon={<HeatPumpIcon />}
                      label={t("tableHeaders.modelIdu")}
                      value={[
                        currentDetails.modelIdu,
                        currentDetails.modelOdu ? `${currentDetails.modelOdu} kW` : null,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                      tooltip={`${t("tableHeaders.modelIdu")} / ${t("tableHeaders.modelOdu")}`}
                    />
                  )}
                </div>
              </div>
            );
          })()}
      </Popover>
    </>
  );
};

export function SystemsGeoMap({ systems, onSystemClick }: SystemsGeoMapProps) {
  const { t } = useTranslation();

  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const dragStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container size for pan calculations
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  // Update container size on mount and resize
  useEffect(() => {
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, [updateContainerSize]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag with left mouse button and not on controls
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest(".zoom-controls")) return;

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
      e.preventDefault();
    },
    [panOffset],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      setPanOffset({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  }, [isDragging]);

  // Group systems by location (lat/lng) to handle clustering
  const mapPoints = useMemo(() => {
    const locationMap = new Map<string, MapPoint>();

    systems.forEach((system) => {
      if (!system.latitude_deg || !system.longitude_deg) return;

      // Round to 2 decimal places to group nearby systems (~1km precision)
      const key = `${system.latitude_deg.toFixed(2)},${system.longitude_deg.toFixed(2)}`;

      const systemDetail: SystemDetails = {
        buildingType: system.building_type ?? null,
        buildingYear: system.building_construction_year ?? null,
        energyStandard: system.building_energy_standard ?? null,
        heatedArea: system.heated_area_m2 ?? null,
        modelIdu: system.model_idu ?? null,
        modelOdu: system.model_odu ?? null,
      };

      const existing = locationMap.get(key);
      if (existing) {
        existing.heatingIds.push(system.heating_id);
        existing.systemNames.push(system.name || t("systems.unnamedSystem"));
        if (system.postal_code && !existing.postalCodes.includes(system.postal_code)) {
          existing.postalCodes.push(system.postal_code);
        }
        existing.systemDetails.push(systemDetail);
        existing.count++;
      } else {
        locationMap.set(key, {
          id: key,
          latitude: system.latitude_deg,
          longitude: system.longitude_deg,
          heatingIds: [system.heating_id],
          systemNames: [system.name || t("systems.unnamedSystem")],
          postalCodes: system.postal_code ? [system.postal_code] : [],
          systemDetails: [systemDetail],
          count: 1,
        });
      }
    });

    return Array.from(locationMap.values());
  }, [systems, t]);

  // Calculate center and scale to fit all systems
  const { rotation, baseScale } = useMemo(() => {
    if (mapPoints.length === 0) {
      return {
        rotation: [-10.5, -51.1, 0] as [number, number, number],
        baseScale: 2600,
      };
    }

    const lats = mapPoints.map((p) => p.latitude);
    const lngs = mapPoints.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latCenter = (minLat + maxLat) / 2;
    const lngCenter = (minLng + maxLng) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff, 0.1);

    const dynamicScale = Math.min(Math.max((2600 * 8) / maxDiff, 1000), 15000);

    return {
      rotation: [-lngCenter, -latCenter, 0] as [number, number, number],
      baseScale: dynamicScale,
    };
  }, [mapPoints]);

  // Apply zoom to scale
  const scale = baseScale * zoomLevel;

  // Calculate projection translation with pan offset (as fraction of container size)
  const projectionTranslation: [number, number] = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return [0.5, 0.5];
    }
    return [0.5 + panOffset.x / containerSize.width, 0.5 + panOffset.y / containerSize.height];
  }, [panOffset, containerSize]);

  if (systems.length === 0) {
    return (
      <Card className="chart-no-data-card">
        <Typography variant="body1" color="textSecondary">
          {t("charts.noData")}
        </Typography>
      </Card>
    );
  }

  return (
    <section
      ref={containerRef}
      className={`chart-container geo-map-container ${isDragging ? "geo-map-container--dragging" : "geo-map-container--idle"}`}
      aria-label={t("systems.title")}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Zoom controls */}
      <div className="zoom-controls geo-map-zoom-controls">
        <IconButton
          size="small"
          onClick={handleZoomIn}
          disabled={zoomLevel >= MAX_ZOOM}
          aria-label={t("common.zoomIn")}
          className="geo-map-zoom-btn-top"
        >
          <AddIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleZoomOut}
          disabled={zoomLevel <= MIN_ZOOM}
          aria-label={t("common.zoomOut")}
          className="geo-map-zoom-btn-bottom"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      </div>

      <ResponsiveGeoMap
        // biome-ignore lint/suspicious/noExplicitAny: GeoJSON Feature types are complex and don't match Nivo's expected types exactly
        features={germanStates.features as any}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        projectionType="mercator"
        projectionScale={scale}
        projectionTranslation={projectionTranslation}
        projectionRotation={rotation}
        fillColor="#e8e8e8"
        borderColor="#999999"
        borderWidth={0.5}
        enableGraticule={false}
        {...({
          layers: [
            "features",
            (props: GeoMapLayerProps) => {
              // As of Nivo 0.8x/0.9x, the projection is often missing in layer props
              // or requires a hook that can crash. Recreating it ensures reliability.
              // Apply pan offset to the translation
              const translateX = props.width * 0.5 + panOffset.x;
              const translateY = props.height * 0.5 + panOffset.y;

              const proj = projectionById
                .mercator()
                .scale(scale)
                .rotate(rotation)
                .translate([translateX, translateY]);

              return (
                <Markers
                  projection={proj}
                  mapPoints={mapPoints}
                  onSystemClick={onSystemClick}
                  t={t}
                />
              );
            },
          ],
          // biome-ignore lint/suspicious/noExplicitAny: Custom layers prop typing is not fully supported by Nivo's type definitions
        } as any)}
      />
    </section>
  );
}
