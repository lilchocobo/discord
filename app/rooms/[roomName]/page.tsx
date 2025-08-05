import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';
import { isVideoCodec } from '@/lib/types';

interface PageProps {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const codec =
    typeof resolvedSearchParams.codec === 'string' && isVideoCodec(resolvedSearchParams.codec)
      ? resolvedSearchParams.codec
      : 'vp9';
  const hq = resolvedSearchParams.hq === 'true' ? true : false;

  return (
    <PageClientImpl
      roomName={resolvedParams.roomName}
      region={resolvedSearchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}