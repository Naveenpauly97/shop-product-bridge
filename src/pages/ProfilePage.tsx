import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const COUNTRIES = [
  { code: 'US', currency: 'USD', symbol: '$' },
  { code: 'GB', currency: 'GBP', symbol: '£' },
  { code: 'EU', currency: 'EUR', symbol: '€' },
  { code: 'JP', currency: 'JPY', symbol: '¥' },
  { code: 'IN', currency: 'INR', symbol: '₹' },
];

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileData, setProfileData] = useState({
    userName: '',
    password: '',
    country: 'US',
    profilePicture: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, user_name, profile_picture, country')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          // console.log('data:', data);
          setProfileData(prev => ({
            ...prev,
            userName: data.user_name || '',
            country: data.country || 'US',
            profilePicture: data.profile_picture || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, profilePicture: publicUrl }));

      // Update profile picture in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture: publicUrl } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {
        id:1,
        user_id: user.id,
        user_name: profileData.userName,
        password: profileData.password,
        country: profileData.country,
        updated_at: new Date().toISOString(),
      };

      // Update profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(updates);

      if (profileError) throw profileError;

      // Update password if provided
      if (profileData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.password,
        });

        if (passwordError) throw passwordError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      // Clear password field after successful update
      setProfileData(prev => ({ ...prev, password: '' }));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // console.log('Profile Data:', profileData);
  // console.log('User:', user);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                      {profileData.profilePicture ? (
                        <img
                          src={profileData.profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ImagePlus className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute bottom-0 right-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="text-sm text-gray-500">
                      Uploading... {Math.round(uploadProgress)}%
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="userName">Username</Label>
                  <Input
                    id="userName"
                    value={profileData.userName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, userName: e.target.value }))}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={profileData.password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave blank to keep current password"
                    minLength={6}
                  />
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={profileData.country}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.code} ({country.currency} - {country.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;