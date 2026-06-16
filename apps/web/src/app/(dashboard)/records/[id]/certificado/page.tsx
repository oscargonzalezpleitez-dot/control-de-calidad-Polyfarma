import CertificadoClient from './certificado.client';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page() {
  return <CertificadoClient />;
}
