import { Outlet } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";
import Loading from "../components/loading";

const AppLayout = () => {
  const { loading } = useLoading();

  return loading ? <Loading /> : <Outlet />;
};

export default AppLayout;
