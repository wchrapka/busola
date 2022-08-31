export const tls = {
  path: 'tls',
  name: 'TLS',
  widget: 'FormGroup',
  children: [
    { path: 'mode', name: 'Mode' },
    { path: 'clientCertificate', name: 'Client Certificate' },
    { path: 'privateKey', name: 'Private Key' },
    { path: 'caCertificates', name: 'CA Certificates' },
    { path: 'credentialName', name: 'Credential Name' },
    {
      path: 'subjectAltNames',
      name: 'Subject Alt Names',
      widget: 'SimpleList',
    },
    { path: 'sni', name: 'SNI' },
    { path: 'insecureSkipVerify', name: 'Insecure Skip Verify' },
  ],
};

const tlsGenericListSyntax = { ...tls };
tlsGenericListSyntax.path = '[].tls';
export { tlsGenericListSyntax };