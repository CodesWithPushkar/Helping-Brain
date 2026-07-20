import { GoogleLogin } from "@react-oauth/google";
import axios from 'axios';
import { useNavigate } from 'react-router-dom'





const Login = () => {
  const navigate = useNavigate();
  return <>
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-8 sm:px-6">
      <h1 className="font-serif text-[32px] font-semibold text-black mb-8 text-center sm:text-[40px] sm:mb-10">Helping Brain</h1>
      <div className="w-full max-w-[380px] flex flex-col">
        <div className="font-mono text-xs text-ink-soft tracking-[0.1em]">SIGN IN</div>
        <h2 className="font-serif text-[26px] font-medium text-ink sm:text-[30px]">Welcome back</h2>
        <p className="font-sans text-[14.5px] font-normal leading-[1.6] text-ink-soft mb-8">Pick up your workspaces right where you left them. New here? The same button creates your account.</p>

          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const response = await axios.post("http://localhost:3000/api/auth/google", {
                    token: credentialResponse.credential,
                });

                const jwt = response.data.token;
                console.log(jwt);
                localStorage.setItem("token", jwt);
                navigate('/dashboard', {replace: true})

              } catch (error) {
                console.error(error);
              }
            }}
            onError={() => {
              console.log("Google Login Failed");
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="380"
          />


          <div className="flex items-center gap-3 my-6 text-[12px] font-mono text-[#A7A38F]">
              <div className="flex-1 h-[1.5px] bg-[#E4E0D6]"></div>

              <span>or</span>

              <div className="flex-1 h-[1.5px] bg-[#E4E0D6]"></div>
          </div>

          <button className="w-full text-center py-[13px] px-[18px] border border-dashed border-line rounded-[8px] bg-transparent font-sans text-[14px] text-ink-soft hover:border-[#D8D3C4] transition-all duration-150">
            Continue with a demo workspace
          </button>


      </div>


      
    </div>
  </>
}

export default Login;