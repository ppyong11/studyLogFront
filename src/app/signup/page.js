'use client'; //form 상태 관리
import Header from "../../components/Header";
import { useState, useEffect } from "react";
import { ConfirmModal } from '../../components/common/modals/ConfirmModal';

const apiUrl= process.env.NEXT_PUBLIC_API_URL;

// 재사용 가능한 입력 필드 컴포넌트
const InputField = ({ id, label, type, placeholder, value, onChange, error, disabled, required = true }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
            {error && <span className="ml-3 text-sm text-red-500">{error}</span>}
        </label>
        
        <div className="mt-1">
            <input
                id={id}
                name={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full p-2 border rounded-md transition-shadow duration-200 ease-in-out
                    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                `}
            />
        </div>
    </div>
);

// 재사용 가능한 버튼 컴포넌트
const ActionButton = ({ onClick, text, disabled, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500 hover:bg-blue-700',
        gray: 'bg-gray-500 hover:bg-gray-600',
        green: 'bg-green-600 hover:bg-green-700'
    };
    
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full h-10.5 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ease-in-out
                ${disabled ? 'bg-gray-300 cursor-not-allowed' : colorClasses[color]}
            `}
        >
            {text}
        </button>
    );
};


// 메인 회원가입 폼 컴포넌트이자 페이지의 기본 내보내기
export default function SignUpForm() {
    // 입력 값 상태
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        email: '',
        authCode: '',
    });

    // 에러 메시지 상태
    const [errors, setErrors] = useState({});

    // 인증 및 확인 상태
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // UI 제어 상태
    const [timer, setTimer] = useState(180); // 3분 = 180초
    const [showAuthCodeInput, setShowAuthCodeInput] = useState(false);
    const [showCancelPopup, setShowCancelPopup] = useState(false);


    // 타이머 로직
    useEffect(() => {
        if (!isEmailSent || isEmailVerified) return;

        const intervalId = setInterval(() => {
            setTimer(prev => {
                if(prev <= 0){
                clearInterval(intervalId);
                return 0;
            }
            return prev-1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isEmailSent, timer, isEmailVerified]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 입력 값 변경 핸들러
const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 모든 필드 입력 시 바로 검증 
    if (['password', 'confirmPassword', 'userId', 'nickname', 'email'].includes(name)) {
        validate(name, value);
    }
};


    // 유효성 검사 함수 (백 보내기 전)
    const validate = (name, value) => {
        let error = '';
        switch (name) {
            case 'userId':
                if (!/^[a-zA-Z0-9]{4,12}$/.test(value)) {
                    error = '아이디는 4~12자 영문 또는 숫자여야 합니다.';
                }
                break;
            case 'password':
                if (!/^[a-zA-Z0-9]{6,20}$/.test(value)) {
                    error = '비밀번호는 6~20자 영문 또는 숫자여야 합니다.';
                }
                break;
            case 'confirmPassword':
                if (value !== formData.password) {
                    error = '비밀번호가 일치하지 않습니다.';
                }
                break;
            case 'nickname':
                if (value.length < 2 || value.length > 10) {
                    error = '닉네임은 2~10자여야 합니다.';
                }
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = '유효한 이메일 형식이 아닙니다.';
                }
                break;
            default:
                break;
        }
        setErrors(prev => ({...prev, [name]: error}));
        return !error;
    };


    // 아이디 중복 확인 핸들러
    const handleIdCheck = () => {
        if (!validate('userId', formData.userId)) return;
        // 실제로는 여기서 백엔드 API 호출
        console.log(`Checking ID: ${formData.userId}`);
        setTimeout(() => {
            // 예시: 'testuser'는 이미 사용 중인 아이디
            if (formData.userId === 'testuser') {
                setErrors(prev => ({ ...prev, userId: '이미 사용 중인 아이디입니다.' }));
            } else {
                alert('사용 가능한 아이디입니다.');
                setIsIdChecked(true);
            }
        }, 500);
    };
    
    // 닉네임 중복 확인 핸들러
    const handleNicknameCheck = () => {
        if (!validate('nickname', formData.nickname)) return;
        // 실제로는 여기서 백엔드 API 호출
        console.log(`Checking Nickname: ${formData.nickname}`);
        setTimeout(() => {
            if (formData.nickname === 'admin') {
                setErrors(prev => ({ ...prev, nickname: '이미 사용 중인 닉네임입니다.' }));
            } else {
                alert('사용 가능한 닉네임입니다.');
                setIsNicknameChecked(true);
            }
        }, 500);
    };

    // 이메일 인증 코드 발송/재전송 핸들러
    const handleEmailSend = () => {
        if (!validate('email', formData.email)) return;
        // 실제로는 여기서 백엔드 API 호출
        console.log(`Sending auth code to: ${formData.email}`);
        alert('인증 코드가 발송되었습니다. 이메일을 확인해주세요.');
        setIsEmailSent(true);
        setShowAuthCodeInput(true);
        setTimer(180); // 타이머 초기화
    };

    // 인증 코드 확인 핸들러
    const handleAuthCodeConfirm = () => {
        if(timer === 0){
        alert("인증 시간이 만료되었습니다. 재전송 버튼을 눌러주세요.");
        return;
        }
        // 실제로는 여기서 백엔드 API 호출
        console.log(`Confirming code: ${formData.authCode}`);
        setTimeout(() => {
            if (formData.authCode === '123456') { // 예시: 정답 코드 '123456'
                alert('이메일 인증이 완료되었습니다.');
                setIsEmailVerified(true);
            } else {
                setErrors(prev => ({ ...prev, authCode: '인증 코드가 올바르지 않습니다.' }));
            }
        }, 500);
    };
    
    // 전체 폼 제출 핸들러
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const isUserIdValid = validate('userId', formData.userId);
        const isPasswordValid = validate('password', formData.password);
        const isConfirmPasswordValid = validate('confirmPassword', formData.confirmPassword);
        const isNicknameValid = validate('nickname', formData.nickname);
        const isEmailValid = validate('email', formData.email);

        if (!isUserIdValid || !isPasswordValid || !isConfirmPasswordValid || !isNicknameValid || !isEmailValid) {
            alert('입력 정보를 다시 확인해주세요.');
            return;
        }

        if (!isIdChecked) {
            alert('아이디 중복 확인을 해주세요.');
            return;
        }
        if (!isNicknameChecked) {
            alert('닉네임 중복 확인을 해주세요.');
            return;
        }
        if (!isEmailVerified) {
            alert('이메일 인증을 완료해주세요.');
            return;
        }

        // 모든 검증 통과 시 백엔드에 데이터 전송
        console.log('Form submitted:', formData);
        alert('회원가입이 완료되었습니다!');
        // 로그인 페이지로 리디렉션 또는 상태 초기화
    };

    // 취소 버튼 핸들러
    const handleCancelClick = () => {
        setShowCancelPopup(true);
    };

    const handleConfirmCancel = () => {
        // 모든 상태 초기화
        setFormData({
            userId: '', password: '', confirmPassword: '', nickname: '', email: '', authCode: '',
        });
        setErrors({});
        setIsIdChecked(false);
        setIsNicknameChecked(false);
        setIsEmailSent(false);
        setIsEmailVerified(false);
        setShowAuthCodeInput(false);
        setTimer(180);
        setShowCancelPopup(false);
        console.log("회원가입이 취소되었습니다.");
    };

    return (
    <>
        <Header />
        <div className="w-screen min-h-screen flex items-center justify-center overflow-auto py-12">
            {showCancelPopup && (
                <ConfirmModal 
                    title="회원가입 취소"
                    message="정말 회원가입을 취소하시겠습니까? 작성된 내용은 저장되지 않습니다."
                    onConfirm={handleConfirmCancel} 
                    onCancel={() => setShowCancelPopup(false)} 
                />
            )}
            
            <div className="w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 max-w-[600px]">
                <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">회원가입</h1>
                <p className="mt-2 text-sm text-gray-600">회원이 되어 스터디 로그의 편리함을 경험해 보세요!</p>
                </div>

                <form className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4">
                        <div className="flex items-end gap-2 w-full">
                            <div className="flex-grow min-w-0">
                                <InputField id="userId" label="아이디" type="text" placeholder="아이디를 입력해 주세요." value={formData.userId} onChange={handleChange} error={errors.userId} disabled={isIdChecked} />
                            </div>
                            <div className="w-28 flex-shrink-0">
                                <ActionButton onClick={handleIdCheck} text={isIdChecked ? '확인 완료' : '중복 확인'} disabled={isIdChecked} color={isIdChecked ? 'gray' : 'blue'} />
                            </div>
                        </div>

                        <InputField id="password" label="비밀번호" type="password" placeholder="비밀번호를 입력해 주세요." value={formData.password} onChange={handleChange} error={errors.password} />
                        <InputField id="confirmPassword" label="비밀번호 확인" type="password" placeholder="비밀번호를 다시 입력해 주세요." value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
                        
                        <div className="flex items-end gap-2 w-full">
                            <div className="flex-grow min-w-0">
                                <InputField id="nickname" label="닉네임" type="text" placeholder="닉네임을 입력해 주세요." value={formData.nickname} onChange={handleChange} error={errors.nickname} disabled={isNicknameChecked} />
                            </div>
                            <div className="w-28 flex-shrink-0">
                                <ActionButton onClick={handleNicknameCheck} text={isNicknameChecked ? '확인 완료' : '중복 확인'} disabled={isNicknameChecked} color={isNicknameChecked ? 'gray' : 'blue'} />
                            </div>
                        </div>

                        <div className="flex items-end gap-2 w-full">
                            <div className="flex-grow min-w-0">
                                <InputField id="email" label="이메일" type="email" placeholder="이메일을 입력해 주세요." value={formData.email} onChange={handleChange} error={errors.email} disabled={isEmailVerified} />
                            </div>
                            <div className="w-28 flex-shrink-0">
                                <ActionButton 
                                    onClick={handleEmailSend} 
                                    text={isEmailVerified ? '인증 완료' : (isEmailSent ? '재전송' : '이메일 인증')} 
                                    disabled={isEmailVerified}
                                    color={isEmailVerified ? 'gray' : (isEmailSent ? 'green' : 'blue')} 
                                />
                            </div>
                        </div>

                        {showAuthCodeInput && !isEmailVerified && (
                            <div className="flex items-end gap-2 w-full">
                                <div className="flex-grow min-w-0 relative">
                                    <InputField id="authCode" label="인증코드 입력" type="text" placeholder="전송된 인증코드를 입력하세요." value={formData.authCode} onChange={handleChange} error={errors.authCode} disabled={isEmailVerified} />
                                    {isEmailSent && timer > 0 && <span className="absolute right-3 top-9 text-sm text-red-500 font-medium">{formatTime(timer)}</span>}
                                    {isEmailSent && timer === 0 && <p className="mt-1 text-sm text-red-500">인증 시간이 만료되었습니다. 재전송 버튼을 눌러주세요.</p>}
                                </div>
                                <div className="w-28 flex-shrink-0">
                                    <ActionButton onClick={handleAuthCodeConfirm} text="확인" disabled={isEmailVerified} color="blue" />
                                </div>
                            </div> 
                        )}
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={handleCancelClick}
                            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700"
                        >
                            회원가입
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </>
    );
}

