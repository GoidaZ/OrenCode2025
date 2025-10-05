import RequestPage from "./pageRender";

export default async function Request({ params }: { params: Promise<{ req_id: string }> }) {
  const unwrappedParams = await params;
  const reqId = parseInt(unwrappedParams.req_id);

  return <RequestPage req_id={reqId}/>
}