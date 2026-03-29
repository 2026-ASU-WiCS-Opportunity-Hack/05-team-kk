declare module "react-simple-maps" {
  import type { ComponentProps, ReactNode, CSSProperties } from "react";

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: GeographyType[] }) => ReactNode;
  }

  export interface GeographyType {
    rsmKey: string;
    properties: Record<string, string>;
    id?: string;
  }

  export interface GeographyProps {
    geography: GeographyType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    style?: CSSProperties | { cursor?: string };
  }

  export interface LineProps {
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: string;
    strokeDasharray?: string;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function Line(props: LineProps): JSX.Element;
}
